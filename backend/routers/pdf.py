from io import BytesIO
from pathlib import PurePosixPath

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from pypdf import PdfMerger, PdfReader, PdfWriter

router = APIRouter()


def is_pdf(filename: str | None) -> bool:
    return PurePosixPath(filename or '').suffix.lower() == '.pdf'


@router.post('/api/pdf/merge')
async def merge_pdfs(files: list[UploadFile] = File(...)):
    try:
        if not files:
            return JSONResponse(status_code=400, content={'status': 'error', 'message': 'Upload at least one PDF file'})
        if any(not is_pdf(file.filename) for file in files):
            return JSONResponse(status_code=400, content={'status': 'error', 'message': 'All uploaded files must be PDF files'})

        try:
            merger = PdfMerger()
            use_writer = False
        except Exception:
            merger = PdfWriter()
            use_writer = True
        try:
            for file in files:
                source = BytesIO(await file.read())
                if use_writer:
                    merger.append_pages_from_reader(PdfReader(source))
                else:
                    merger.append(source)
            output = BytesIO()
            merger.write(output)
        finally:
            close = getattr(merger, 'close', None)
            if close:
                close()
        output.seek(0)
        return StreamingResponse(
            output,
            media_type='application/pdf',
            headers={'Content-Disposition': 'attachment; filename=merged_document.pdf'},
        )
    except Exception as error:
        return JSONResponse(status_code=500, content={'status': 'error', 'message': str(error)})


@router.post('/api/pdf/extract-text')
async def extract_pdf_text(file: UploadFile = File(...)):
    try:
        if not is_pdf(file.filename):
            return JSONResponse(status_code=400, content={'status': 'error', 'message': 'Uploaded file must be a PDF file'})
        reader = PdfReader(BytesIO(await file.read()))
        content = [
            {'page': page_number, 'text': page.extract_text() or ''}
            for page_number, page in enumerate(reader.pages, start=1)
        ]
        return {'status': 'success', 'total_pages': len(reader.pages), 'content': content}
    except Exception as error:
        return JSONResponse(status_code=500, content={'status': 'error', 'message': str(error)})
