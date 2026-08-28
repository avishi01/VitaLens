import fitz
import pytesseract
from PIL import Image

from app.core.config import settings


# Only override the Tesseract binary path if explicitly configured
# (e.g. Windows, where it isn't on PATH). On Linux/Mac with Tesseract
# installed normally, pytesseract finds it on PATH automatically.
if settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


def extract_text_from_pdf(file_path: str) -> str:
    document = fitz.open(file_path)

    try:
        # First: try extracting normal PDF text
        text = []

        for page in document:
            text.append(page.get_text())

        extracted_text = "\n".join(text).strip()

        if extracted_text:
            return extracted_text

        # Fallback: OCR scanned/image PDF
        ocr_text = []

        for page in document:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))

            image = Image.frombytes(
                "RGB",
                [pix.width, pix.height],
                pix.samples,
            )

            page_text = pytesseract.image_to_string(image)
            ocr_text.append(page_text)

        return "\n".join(ocr_text).strip()

    finally:
        document.close() 