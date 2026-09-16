import asyncio
import shutil
import uuid
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.background import BackgroundTask

router = APIRouter()
STORAGE = Path(__file__).parents[1] / 'storage'
STORAGE.mkdir(exist_ok=True)


class DownloadRequest(BaseModel):
    url: str
    kind: str = 'video'


def download_media(url: str, kind: str, job: Path) -> Path:
    from yt_dlp import YoutubeDL

    options = {
        'noplaylist': True,
        'outtmpl': str(job / '%(title).80s.%(ext)s'),
        'restrictfilenames': True,
        'format': 'bestaudio/best' if kind == 'audio' else 'best[ext=mp4]/best',
        'quiet': True,
        'no_warnings': True,
    }
    with YoutubeDL(options) as downloader:
        info = downloader.extract_info(url, download=True)
        downloaded = Path(downloader.prepare_filename(info))
    if not downloaded.exists():
        candidates = list(job.iterdir())
        if not candidates:
            raise RuntimeError('The downloader did not produce a file.')
        downloaded = candidates[0]
    return downloaded


def cleanup_job(job: Path) -> None:
    shutil.rmtree(job, ignore_errors=True)


@router.post('/media')
async def media_download(request: DownloadRequest):
    parsed = urlparse(request.url)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        raise HTTPException(400, 'Enter a valid http:// or https:// media URL')
    if request.kind not in {'video', 'audio'}:
        raise HTTPException(400, 'Download kind must be video or audio')

    job = STORAGE / f'download-{uuid.uuid4().hex}'
    job.mkdir(parents=True)
    try:
        output = await asyncio.to_thread(download_media, request.url, request.kind, job)
    except Exception as error:
        cleanup_job(job)
        raise HTTPException(422, f'Media download failed: {error}') from error

    return FileResponse(output, media_type='application/octet-stream', filename=output.name, background=BackgroundTask(cleanup_job, job))