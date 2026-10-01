from io import BytesIO
from pathlib import PurePath

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from pypdf import PdfMerger, PdfReader

router = APIRouter()


def is_pdf(filename: str | None) -> bool:
    return PurePath(filename or '').suffix.lower() == '.pdf'


@router.post('/pdf/merge')
async def merge_pdfs(files: list[UploadFile] = File(...)):
    if not files:
        return JSONResponse(
            status_code=400,
            content={'status': 'error', 'message': 'Upload at least one PDF file.'},
        )
    if any(not is_pdf(file.filename) for file in files):
        return JSONResponse(
            status_code=400,
            content={'status': 'error', 'message': 'All files must have a .pdf extension.'},
        )

    merger = PdfMerger()
    try:
        for file in files:
            merger.append(BytesIO(await file.read()))
        output = BytesIO()
        merger.write(output)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type='application/pdf',
            headers={
                'Content-Disposition': 'attachment; filename=merged_document.pdf',
            },
        )
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={'status': 'error', 'message': str(error)},
        )
    finally:
        merger.close()


@router.post('/pdf/extract-text')
async def extract_text(file: UploadFile = File(...)):
    if not is_pdf(file.filename):
        return JSONResponse(
            status_code=400,
            content={'status': 'error', 'message': 'The uploaded file must be a PDF.'},
        )

    try:
        reader = PdfReader(BytesIO(await file.read()))
        pages = [
            {'page': page_number, 'text': page.extract_text() or ''}
            for page_number, page in enumerate(reader.pages, start=1)
        ]
        return {'status': 'success', 'pages': pages}
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={'status': 'error', 'message': str(error)},
        )
