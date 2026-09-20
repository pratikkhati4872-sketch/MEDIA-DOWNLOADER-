from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from tempfile import TemporaryDirectory
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

@router.post('/zip')
async def batch_zip(files: list[UploadFile] = File(...)):
    if not files: raise HTTPException(400, 'Select at least one file')
    if len(files) > 20: raise HTTPException(400, 'Maximum 20 files per batch')
    directory = TemporaryDirectory(); archive = Path(directory.name) / 'format-studio-batch.zip'
    try:
        with ZipFile(archive, 'w', compression=ZIP_DEFLATED) as zip_file:
            used_names: set[str] = set()
            for index, file in enumerate(files):
                name = Path(file.filename or f'file-{index}').name or f'file-{index}'
                original_name = name
                suffix = 1
                while name in used_names:
                    stem = Path(original_name).stem
                    extension = Path(original_name).suffix
                    name = f'{stem}-{suffix}{extension}'
                    suffix += 1
                used_names.add(name)
                zip_file.writestr(name, await file.read())
    except Exception:
        directory.cleanup()
        raise
    return FileResponse(archive, media_type='application/zip', filename='format-studio-batch.zip', background=directory.cleanup)
