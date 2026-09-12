from io import BytesIO
from PIL import Image
import pytesseract

def extract_text(data: bytes, content_type: str) -> str:
    image = Image.open(BytesIO(data))
    return pytesseract.image_to_string(image)
