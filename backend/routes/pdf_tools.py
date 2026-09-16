from pathlib import Path
import shutil, subprocess, uuid
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from backend.services.ocr_service import extract_text

router = APIRouter()
STORAGE = Path(__file__).parents[1] / 'storage'
STORAGE.mkdir(exist_ok=True)

@router.post('/to-docx')
async def pdf_to_docx(file: UploadFile = File(...)):
    if file.content_type != 'application/pdf': raise HTTPException(400, 'Upload a PDF file')
    job = STORAGE / uuid.uuid4().hex; job.mkdir()
    source = job / 'source.pdf'; target = job / 'output.docx'
    with source.open('wb') as buffer: shutil.copyfileobj(file.file, buffer)
    try:
        from pdf2docx import Converter
        converter = Converter(str(source)); converter.convert(str(target)); converter.close()
    except Exception as error: raise HTTPException(422, f'PDF conversion failed: {error}')
    return FileResponse(target, media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename=f'{Path(file.filename or "document").stem}.docx')

@router.post('/to-pdf')
async def docx_to_pdf(file: UploadFile = File(...)):
    job = STORAGE / uuid.uuid4().hex; job.mkdir()
    source = job / (file.filename or 'document.docx')
    with source.open('wb') as buffer: shutil.copyfileobj(file.file, buffer)
    result = subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', str(job), str(source)], capture_output=True)
    output = source.with_suffix('.pdf')
    if result.returncode != 0 or not output.exists(): raise HTTPException(422, 'LibreOffice could not convert this document')
    return FileResponse(output, media_type='application/pdf', filename=output.name)

@router.post('/ocr')
async def ocr(file: UploadFile = File(...)):
    data = await file.read()
    return {'filename': file.filename, 'text': extract_text(data, file.content_type or '')}
