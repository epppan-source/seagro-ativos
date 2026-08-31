import uuid
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.transferencia import Transferencia, StatusTransferencia
from app.models.ativo import Ativo, StatusAtivo
from app.models.funcionario import Funcionario, RoleFuncionario
from app.services.email_service import EmailService
from app.services.auditoria_service import registrar_auditoria
from app.config import settings


class TransferenciaService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.email_service = EmailService()

    async def solicitar(self, ativo_id: uuid.UUID, solicitante: Funcionario, novo_responsavel_id: uuid.UUID, motivo: str | None) -> Transferencia:
        ativo = await self.db.get(Ativo, ativo_id)
        if not ativo:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Ativo não encontrado")
        pode_qualquer_ativo = (
            solicitante.role == RoleFuncionario.gestor
            or solicitante.pode_transferir_qualquer_ativo
        )
        if ativo.responsavel_id != solicitante.id and not pode_qualquer_ativo:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Você não é o responsável atual por este ativo")

        transferencia = Transferencia(
            ativo_id=ativo_id,
            solicitante_id=solicitante.id,
            responsavel_atual_id=ativo.responsavel_id or solicitante.id,
            novo_responsavel_id=novo_responsavel_id,
            motivo_solicitacao=motivo,
        )
        self.db.add(transferencia)
        await self.db.commit()

        novo_responsavel_obj = await self.db.get(Funcionario, novo_responsavel_id)
        novo_responsavel_nome = novo_responsavel_obj.nome_completo if novo_responsavel_obj else "—"

        result = await self.db.execute(select(Funcionario).where(Funcionario.role == RoleFuncionario.gestor))
        for gestor in result.scalars().all():
            await self.email_service.enviar_solicitacao_transferencia(
                gestor.email, gestor.nome_completo, ativo.codigo_interno,
                solicitante.nome_completo, novo_responsavel_nome, motivo,
            )

        await registrar_auditoria(self.db, solicitante.id, "transferencias", "CREATE", transferencia.id)
        return transferencia

    async def decidir(self, transferencia_id: uuid.UUID, aprovador: Funcionario, aprovar: bool, motivo_rejeicao: str | None) -> Transferencia:
        transferencia = await self.db.get(Transferencia, transferencia_id)
        if not transferencia:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Transferência não encontrada")
        if transferencia.status != StatusTransferencia.PENDENTE:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Esta transferência já foi processada")

        ativo = await self.db.get(Ativo, transferencia.ativo_id)
        novo_responsavel = await self.db.get(Funcionario, transferencia.novo_responsavel_id)
        solicitante = await self.db.get(Funcionario, transferencia.solicitante_id)

        transferencia.aprovador_id = aprovador.id
        transferencia.aprovado_rejeitado_em = datetime.utcnow()

        if aprovar:
            transferencia.status = StatusTransferencia.APROVADA
            transferencia.concluido_em = datetime.utcnow()

            responsavel_anterior_obj = await self.db.get(Funcionario, transferencia.responsavel_atual_id)
            responsavel_anterior_nome = responsavel_anterior_obj.nome_completo if responsavel_anterior_obj else "Depósito"
            data_hora = (datetime.utcnow() - timedelta(hours=3)).strftime("%d/%m/%Y às %H:%M")

            ativo.responsavel_id = novo_responsavel.id
            ativo.status = StatusAtivo.NA_MAO_FUNCIONARIO

            await self.email_service.enviar_transferencia_aprovada(
                solicitante.email, solicitante.nome_completo, ativo.codigo_interno,
                ativo.modelo, novo_responsavel.nome_completo, data_hora,
            )
            await self.email_service.enviar_transferencia_novo_responsavel(
                novo_responsavel.email, novo_responsavel.nome_completo,
                ativo.codigo_interno, ativo.modelo, responsavel_anterior_nome, data_hora,
            )
            result_gestores = await self.db.execute(select(Funcionario).where(Funcionario.role == RoleFuncionario.gestor))
            for gestor in result_gestores.scalars().all():
                await self.email_service.enviar_transferencia_aprovada_gestor(
                    gestor.email, gestor.nome_completo, ativo.codigo_interno,
                    ativo.modelo, responsavel_anterior_nome, novo_responsavel.nome_completo, data_hora,
                )
        else:
            transferencia.status = StatusTransferencia.REJEITADA
            transferencia.motivo_rejeicao = motivo_rejeicao
            await self.email_service.enviar_transferencia_rejeitada(solicitante.email, solicitante.nome_completo, ativo.codigo_interno, motivo_rejeicao)

        await self.db.commit()
        await registrar_auditoria(self.db, aprovador.id, "transferencias", "UPDATE", transferencia.id)
        return transferencia
