from pathlib import Path
import shutil, subprocess, uuid
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from backend.services.ocr_service import extract_text

router = APIRouter()
STORAGE = Path(__file__).parents[1] / 'storage'
STORAGE.mkdir(exist_ok=True)


def cleanup_job(job: Path) -> None:
    shutil.rmtree(job, ignore_errors=True)


def require_content_type(file: UploadFile, expected: str) -> None:
    if file.content_type != expected:
        raise HTTPException(400, f'Upload a {expected.split("/")[-1].upper()} file')

@router.post('/to-docx')
async def pdf_to_docx(file: UploadFile = File(...)):
    require_content_type(file, 'application/pdf')
    job = STORAGE / uuid.uuid4().hex; job.mkdir()
    source = job / 'source.pdf'; target = job / 'output.docx'
    with source.open('wb') as buffer: shutil.copyfileobj(file.file, buffer)
    try:
        from pdf2docx import Converter
        converter = Converter(str(source)); converter.convert(str(target)); converter.close()
    except Exception as error:
        cleanup_job(job)
        raise HTTPException(422, f'PDF conversion failed: {error}') from error
    return FileResponse(target, media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename=f'{Path(file.filename or "document").stem}.docx', background=BackgroundTask(cleanup_job, job))

@router.post('/to-pdf')
async def docx_to_pdf(file: UploadFile = File(...)):
    require_content_type(file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    job = STORAGE / uuid.uuid4().hex; job.mkdir()
    source = job / 'source.docx'
    with source.open('wb') as buffer: shutil.copyfileobj(file.file, buffer)
    try:
        result = subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', str(job), str(source)], capture_output=True, text=True, timeout=120)
    except (FileNotFoundError, subprocess.TimeoutExpired) as error:
        cleanup_job(job)
        raise HTTPException(422, 'LibreOffice is unavailable or took too long to convert this document') from error
    output = source.with_suffix('.pdf')
    if result.returncode != 0 or not output.exists():
        cleanup_job(job)
        raise HTTPException(422, 'LibreOffice could not convert this document')
    return FileResponse(output, media_type='application/pdf', filename=f'{Path(file.filename or "document").stem}.pdf', background=BackgroundTask(cleanup_job, job))

@router.post('/ocr')
async def ocr(file: UploadFile = File(...)):
    if file.content_type != 'application/pdf' and not (file.content_type or '').startswith('image/'):
        raise HTTPException(400, 'Upload a PDF or image file')
    data = await file.read()
    try:
        text = extract_text(data, file.content_type or '')
    except Exception as error:
        raise HTTPException(422, 'OCR could not read this file') from error
    return {'filename': file.filename, 'text': text}
