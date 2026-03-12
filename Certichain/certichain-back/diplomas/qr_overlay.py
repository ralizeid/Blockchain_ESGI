from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile

import qrcode
from PIL import Image, UnidentifiedImageError
from pypdf import PdfReader, PdfWriter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def _clamp(value, minimum, maximum):
    return max(minimum, min(value, maximum))


def _build_qr_image(verify_url, size_px):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=12,
        border=2,
    )
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    return qr_img.resize((size_px, size_px), Image.Resampling.LANCZOS)


def _overlay_on_image(uploaded_file, verify_url, x_pct, y_pct, size_pct):
    uploaded_file.open("rb")
    try:
        base = Image.open(uploaded_file)
    except UnidentifiedImageError as exc:
        raise ValueError("Format image non supporté pour l'intégration du QR.") from exc

    base_format = (base.format or "PNG").upper()
    base_rgba = base.convert("RGBA")
    width, height = base_rgba.size

    qr_px = max(32, int(min(width, height) * (size_pct / 100.0)))
    qr_img = _build_qr_image(verify_url, qr_px)

    x = int(width * (x_pct / 100.0))
    y = int(height * (y_pct / 100.0))
    x = _clamp(x, 0, max(0, width - qr_px))
    y = _clamp(y, 0, max(0, height - qr_px))

    base_rgba.paste(qr_img, (x, y), qr_img)

    output = BytesIO()
    if base_format in {"JPG", "JPEG"}:
        base_rgba.convert("RGB").save(output, format="JPEG", quality=95)
        ext = ".jpg"
    elif base_format == "WEBP":
        base_rgba.save(output, format="WEBP", quality=95)
        ext = ".webp"
    else:
        base_rgba.save(output, format="PNG")
        ext = ".png"

    output.seek(0)
    stem = Path(uploaded_file.name).stem
    return ContentFile(output.read(), name=f"{stem}_qr{ext}")


def _overlay_on_pdf(uploaded_file, verify_url, x_pct, y_pct, size_pct):
    uploaded_file.open("rb")
    reader = PdfReader(uploaded_file)
    if not reader.pages:
        raise ValueError("PDF invalide: aucune page détectée.")

    first_page = reader.pages[0]
    width = float(first_page.mediabox.width)
    height = float(first_page.mediabox.height)
    size_pt = max(24.0, min(width, height) * (size_pct / 100.0))

    # Coordonnées reçues en pourcentage avec origine en haut-gauche (comme l'UI).
    x_top_left = width * (x_pct / 100.0)
    y_top_left = height * (y_pct / 100.0)
    x = _clamp(x_top_left, 0.0, max(0.0, width - size_pt))
    y = _clamp(height - size_pt - y_top_left, 0.0, max(0.0, height - size_pt))

    qr_px = 1200
    qr_img = _build_qr_image(verify_url, qr_px)
    qr_buffer = BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)

    overlay_buffer = BytesIO()
    c = canvas.Canvas(overlay_buffer, pagesize=(width, height))
    c.drawImage(ImageReader(qr_buffer), x, y, width=size_pt, height=size_pt, mask="auto")
    c.save()
    overlay_buffer.seek(0)

    overlay_page = PdfReader(overlay_buffer).pages[0]
    first_page.merge_page(overlay_page)

    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)

    out_pdf = BytesIO()
    writer.write(out_pdf)
    out_pdf.seek(0)

    stem = Path(uploaded_file.name).stem
    return ContentFile(out_pdf.read(), name=f"{stem}_qr.pdf")


def embed_qr_in_diploma(uploaded_file, verify_url, x_pct, y_pct, size_pct):
    """Embed a verification QR into an image or the first page of a PDF file."""
    ext = Path(uploaded_file.name).suffix.lower()
    if ext == ".pdf":
        return _overlay_on_pdf(uploaded_file, verify_url, x_pct, y_pct, size_pct)
    if ext in IMAGE_EXTENSIONS:
        return _overlay_on_image(uploaded_file, verify_url, x_pct, y_pct, size_pct)
    raise ValueError("Format non supporté pour l'intégration du QR (utilisez PDF/PNG/JPG/WEBP).")