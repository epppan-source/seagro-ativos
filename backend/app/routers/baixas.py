import uuid
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.baixa import SolicitacaoBaixa, StatusBaixa, TipoItemBaixa
from app.models.material import Material, MaterialMovimento
from app.models.peca_reposicao import PecaReposicao, PecaMovimento
from app.models.funcionario import Funcionario
from app.schemas.baixa import SolicitacaoBaixaCreate, SolicitacaoBaixaDecisao, SolicitacaoBaixaOut
from app.services.email_service import EmailService
from app.config import settings

router = APIRouter(prefix="/api/baixas", tags=["baixas"])

LOAD_OPTIONS = [
    selectinload(SolicitacaoBaixa.solicitante),
    selectinload(SolicitacaoBaixa.aprovador),
    selectinload(SolicitacaoBaixa.material),
    selectinload(SolicitacaoBaixa.peca),
]


@router.get("", response_model=list[SolicitacaoBaixaOut])
async def listar(
    db: AsyncSession = Depends(get_db),
    usuario: Funcionario = Depends(get_current_user),
):
    q = (
        select(SolicitacaoBaixa)
        .options(*LOAD_OPTIONS)
        .order_by(SolicitacaoBaixa.solicitado_em.desc())
    )
    if usuario.role.value != "gestor":
        q = q.where(SolicitacaoBaixa.solicitante_id == usuario.id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=SolicitacaoBaixaOut)
async def solicitar(
    dados: SolicitacaoBaixaCreate,
    db: AsyncSession = Depends(get_db),
    usuario: Funcionario = Depends(get_current_user),
):
    if dados.tipo_item == TipoItemBaixa.MATERIAL:
        if not dados.material_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Informe o material")
        item = await db.get(Material, dados.material_id)
        if not item:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Material não encontrado")
    else:
        if not dados.peca_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Informe a peça de reposição")
        item = await db.get(PecaReposicao, dados.peca_id)
        if not item:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Peça não encontrada")

    if dados.quantidade <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Quantidade deve ser maior que zero")
    if item.quantidade_atual < dados.quantidade:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Estoque insuficiente ({float(item.quantidade_atual)} {item.unidade} disponíveis)",
        )

    baixa = SolicitacaoBaixa(
        solicitante_id=usuario.id,
        tipo_item=dados.tipo_item,
        material_id=dados.material_id,
        peca_id=dados.peca_id,
        quantidade=dados.quantidade,
        obra=dados.obra,
    )
    db.add(baixa)
    await db.commit()

    result = await db.execute(
        select(SolicitacaoBaixa).options(*LOAD_OPTIONS).where(SolicitacaoBaixa.id == baixa.id)
    )
    baixa = result.scalar_one()

    try:
        await EmailService().enviar_solicitacao_baixa(
            email_gestor=settings.GESTOR_EMAIL,
            solicitante_nome=usuario.nome_completo,
            item_nome=item.nome,
            quantidade=float(dados.quantidade),
            unidade=item.unidade,
            obra=dados.obra,
        )
    except Exception:
        pass

    return baixa


@router.post(
    "/{baixa_id}/decisao",
    response_model=SolicitacaoBaixaOut,
    dependencies=[Depends(require_role("gestor"))],
)
async def decidir(
    baixa_id: uuid.UUID,
    dados: SolicitacaoBaixaDecisao,
    db: AsyncSession = Depends(get_db),
    usuario: Funcionario = Depends(get_current_user),
):
    result = await db.execute(
        select(SolicitacaoBaixa).options(*LOAD_OPTIONS).where(SolicitacaoBaixa.id == baixa_id)
    )
    baixa = result.scalar_one_or_none()
    if not baixa:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Solicitação não encontrada")
    if baixa.status != StatusBaixa.PENDENTE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Solicitação já foi processada")

    baixa.aprovador_id = usuario.id
    baixa.aprovado_rejeitado_em = datetime.utcnow()

    if dados.aprovar:
        if baixa.tipo_item == TipoItemBaixa.MATERIAL:
            item = await db.get(Material, baixa.material_id)
            if not item or item.quantidade_atual < baixa.quantidade:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Estoque insuficiente para aprovar")
            item.quantidade_atual -= baixa.quantidade
            db.add(MaterialMovimento(
                material_id=item.id,
                tipo="SAIDA",
                quantidade=baixa.quantidade,
                data=date.today(),
                observacao=f"Baixa aprovada - Obra: {baixa.obra}",
                registrado_por_id=usuario.id,
            ))
        else:
            item = await db.get(PecaReposicao, baixa.peca_id)
            if not item or item.quantidade_atual < baixa.quantidade:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Estoque insuficiente para aprovar")
            item.quantidade_atual -= baixa.quantidade
            db.add(PecaMovimento(
                peca_id=item.id,
                tipo="SAIDA",
                quantidade=baixa.quantidade,
                data=date.today(),
                observacao=f"Baixa aprovada - Obra: {baixa.obra}",
                registrado_por_id=usuario.id,
            ))

        baixa.status = StatusBaixa.APROVADA
        try:
            await EmailService().enviar_baixa_aprovada(
                email=baixa.solicitante.email,
                nome=baixa.solicitante.nome_completo,
                item_nome=item.nome,
                quantidade=float(baixa.quantidade),
                unidade=item.unidade,
                obra=baixa.obra,
            )
        except Exception:
            pass
    else:
        if not dados.motivo_rejeicao:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Informe o motivo da rejeição")
        baixa.status = StatusBaixa.REJEITADA
        baixa.motivo_rejeicao = dados.motivo_rejeicao
        try:
            item_nome = baixa.material.nome if baixa.material else (baixa.peca.nome if baixa.peca else "item")
            await EmailService().enviar_baixa_rejeitada(
                email=baixa.solicitante.email,
                nome=baixa.solicitante.nome_completo,
                item_nome=item_nome,
                motivo=dados.motivo_rejeicao,
            )
        except Exception:
            pass

    await db.commit()

    result = await db.execute(
        select(SolicitacaoBaixa).options(*LOAD_OPTIONS).where(SolicitacaoBaixa.id == baixa.id)
    )
    return result.scalar_one()
