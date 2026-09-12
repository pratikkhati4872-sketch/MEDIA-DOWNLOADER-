from pathlib import Path
from zipfile import ZipFile
from tempfile import TemporaryDirectory
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

@router.post('/zip')
async def batch_zip(files: list[UploadFile] = File(...)):
    if len(files) > 20: raise HTTPException(400, 'Maximum 20 files per batch')
    directory = TemporaryDirectory(); archive = Path(directory.name) / 'format-studio-batch.zip'
    with ZipFile(archive, 'w') as zip_file:
        for index, file in enumerate(files): zip_file.writestr(file.filename or f'file-{index}', await file.read())
    return FileResponse(archive, media_type='application/zip', filename='format-studio-batch.zip', background=directory.cleanup)
