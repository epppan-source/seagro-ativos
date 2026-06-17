import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Environment, FileSystemLoader
import os
from app.config import settings

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "email_templates")
env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))


class EmailService:
    def _renderizar(self, template_nome: str, contexto: dict) -> str:
        template = env.get_template(template_nome)
        return template.render(**contexto, app_url=settings.APP_URL, app_name=settings.APP_NAME)

    async def _enviar(self, destinatario: str, assunto: str, html: str):
        msg = MIMEMultipart("alternative")
        msg["Subject"] = assunto
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = destinatario
        msg.attach(MIMEText(html, "html"))

        if not settings.SMTP_PASSWORD:
            print(f"[EMAIL SIMULADO] Para: {destinatario} | Assunto: {assunto}")
            return

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, destinatario, msg.as_string())

    async def enviar_credenciais_iniciais(self, email: str, nome: str, login: str, senha_temporaria: str):
        html = self._renderizar("credenciais_iniciais.html", {
            "nome": nome, "login": login, "senha_temporaria": senha_temporaria,
        })
        await self._enviar(email, f"Bem-vindo(a) ao {settings.APP_NAME}", html)

    async def enviar_reset_senha(self, email: str, nome: str, token: str):
        link = f"{settings.APP_URL}/redefinir-senha?token={token}"
        html = self._renderizar("reset_senha.html", {"nome": nome, "link": link})
        await self._enviar(email, "Redefinição de senha", html)

    async def enviar_solicitacao_transferencia(self, email_gestor: str, nome_gestor: str, ativo_codigo: str, solicitante_nome: str, novo_responsavel_nome: str, motivo: str | None):
        html = self._renderizar("solicitacao_transferencia.html", {
            "nome_gestor": nome_gestor, "ativo_codigo": ativo_codigo,
            "solicitante_nome": solicitante_nome, "novo_responsavel_nome": novo_responsavel_nome,
            "motivo": motivo or "Não informado",
        })
        await self._enviar(email_gestor, f"Nova solicitação de transferência - {ativo_codigo}", html)

    async def enviar_transferencia_aprovada(self, email: str, nome: str, ativo_codigo: str):
        html = self._renderizar("transferencia_aprovada.html", {"nome": nome, "ativo_codigo": ativo_codigo})
        await self._enviar(email, f"Transferência aprovada - {ativo_codigo}", html)

    async def enviar_transferencia_rejeitada(self, email: str, nome: str, ativo_codigo: str, motivo: str | None):
        html = self._renderizar("transferencia_rejeitada.html", {
            "nome": nome, "ativo_codigo": ativo_codigo, "motivo": motivo or "Não informado",
        })
        await self._enviar(email, f"Transferência rejeitada - {ativo_codigo}", html)

    async def enviar_alerta_manutencao(self, email_gestor: str, ativo_codigo: str, data_prevista: str):
        html = self._renderizar("alerta_manutencao.html", {"ativo_codigo": ativo_codigo, "data_prevista": data_prevista})
        await self._enviar(email_gestor, f"Manutenção próxima - {ativo_codigo}", html)

    async def enviar_alerta_estoque_baixo(self, email_gestor: str, material_nome: str, quantidade_atual, quantidade_minima):
        html = self._renderizar("alerta_estoque_baixo.html", {
            "material_nome": material_nome, "quantidade_atual": quantidade_atual, "quantidade_minima": quantidade_minima,
        })
        await self._enviar(email_gestor, f"Estoque baixo - {material_nome}", html)
