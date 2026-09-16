from io import BytesIO

from PIL import Image
import pytesseract


def extract_text(data: bytes, content_type: str) -> str:
    if content_type == 'application/pdf':
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(data))
        return '\n\n'.join(page.extract_text() or '' for page in reader.pages).strip()

    image = Image.open(BytesIO(data))
    return pytesseract.image_to_string(image)
