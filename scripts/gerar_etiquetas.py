"""
Gera o PDF de etiquetas QR Code para os ativos da SEAGRO.

Cria etiquetas, cada uma com:
- QR Code apontando para https://ativos.seagro.com.br/codigo/{codigo}
- "SEAGRO" entre o QR e o código
- Texto do código abaixo (ex: EQ-0001)

Tamanho de cada etiqueta: ~3,5 x 3,5 cm, em grade numa folha A4,
pronto para enviar pra gráfica especializada em etiqueta de poliéster.

Uso:
    python3 gerar_etiquetas.py

Saída:
    etiquetas_seagro.pdf (nesta mesma pasta)
"""

import io
import os
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

BASE_URL = "https://ativos.seagro.com.br/codigo/"
QTD_POR_CATEGORIA = {
    "EQ": 50,
    "FE": 65,
    "AC": 60,
}

# Layout da etiqueta
TAM_ETIQUETA = 3.5 * cm
MARGEM_PAGINA = 1.0 * cm
ESPACO_ENTRE = 0.2 * cm

SAIDA = os.path.join(os.path.dirname(__file__), "etiquetas_seagro.pdf")


def gerar_qrcode_imagem(codigo: str) -> ImageReader:
    url = f"{BASE_URL}{codigo}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ImageReader(buf)


def gerar_codigos():
    codigos = []
    for prefixo, qtd in QTD_POR_CATEGORIA.items():
        for i in range(1, qtd + 1):
            codigos.append(f"{prefixo}-{i:04d}")
    return codigos


def main():
    codigos = gerar_codigos()
    largura_pagina, altura_pagina = A4

    area_util_largura = largura_pagina - 2 * MARGEM_PAGINA
    area_util_altura = altura_pagina - 2 * MARGEM_PAGINA

    colunas = int(area_util_largura // (TAM_ETIQUETA + ESPACO_ENTRE))
    linhas = int(area_util_altura // (TAM_ETIQUETA + ESPACO_ENTRE))
    por_pagina = colunas * linhas

    c = canvas.Canvas(SAIDA, pagesize=A4)

    for indice, codigo in enumerate(codigos):
        pos_na_pagina = indice % por_pagina
        if pos_na_pagina == 0 and indice != 0:
            c.showPage()

        col = pos_na_pagina % colunas
        lin = pos_na_pagina // colunas

        x = MARGEM_PAGINA + col * (TAM_ETIQUETA + ESPACO_ENTRE)
        y = altura_pagina - MARGEM_PAGINA - (lin + 1) * (TAM_ETIQUETA + ESPACO_ENTRE)

        # contorno de corte (linha fina, ajuda a gráfica a cortar certo)
        c.setLineWidth(0.3)
        c.rect(x, y, TAM_ETIQUETA, TAM_ETIQUETA)

        # QR code ocupando a parte de cima da etiqueta
        qr_img = gerar_qrcode_imagem(codigo)
        qr_tam = TAM_ETIQUETA * 0.58
        qr_x = x + (TAM_ETIQUETA - qr_tam) / 2
        qr_y = y + TAM_ETIQUETA - qr_tam - 0.05 * cm
        c.drawImage(qr_img, qr_x, qr_y, width=qr_tam, height=qr_tam)

        # "SEAGRO" entre o QR e o código
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(x + TAM_ETIQUETA / 2, y + 0.5 * cm, "SEAGRO")

        # texto do código abaixo do QR
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(x + TAM_ETIQUETA / 2, y + 0.12 * cm, codigo)

    c.save()
    print(f"OK: {len(codigos)} etiquetas geradas em {SAIDA}")
    print(f"Grade: {colunas} colunas x {linhas} linhas = {por_pagina} etiquetas por pagina")


if __name__ == "__main__":
    main()
