from io import BytesIO
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from backend.services.bg_remover import remove_background

router = APIRouter()

@router.post('/remove-background')
async def remove_bg(file: UploadFile = File(...)):
    if not (file.content_type or '').startswith('image/'): raise HTTPException(400, 'Upload an image file')
    output = remove_background(await file.read())
    return StreamingResponse(BytesIO(output), media_type='image/png', headers={'Content-Disposition': 'attachment; filename="cutout.png"'})
