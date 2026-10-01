import asyncio
import mimetypes
import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.background import BackgroundTask

router = APIRouter()


class DownloadRequest(BaseModel):
    url: str
    kind: str = 'video'
    quality: str = 'best'


def download_media_file(url: str, kind: str, quality: str) -> tuple[tempfile.TemporaryDirectory, Path]:
    from yt_dlp import YoutubeDL

    max_height = {'1080p': 1080, '720p': 720, '420p': 420}.get(quality)
    height_filter = f'[height<={max_height}]' if max_height else ''
    directory = tempfile.TemporaryDirectory(prefix='format-studio-')
    options = {
        'noplaylist': True,
        'outtmpl': str(Path(directory.name) / '%(title).180B.%(ext)s'),
        'format': 'bestaudio/best' if kind == 'audio' else f'bestvideo{height_filter}+bestaudio/best{height_filter}',
        'quiet': True,
        'merge_output_format': 'mp4' if kind == 'video' else None,
        'remote_components': ['ejs:github'],
        'extractor_args': {'youtube': {'player_client': ['android_vr', 'android']}},
    }
    deno = shutil.which('deno') or str(Path.cwd() / '.deno' / 'bin' / 'deno')
    if Path(deno).is_file():
        options['js_runtimes'] = {'deno': {'path': deno}}
    if kind == 'audio':
        options['postprocessors'] = [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3'}]

    try:
        with YoutubeDL(options) as downloader:
            downloader.download([url])
        files = [path for path in Path(directory.name).iterdir() if path.is_file()]
        if not files:
            raise RuntimeError('The downloader did not produce a media file.')
        return directory, max(files, key=lambda path: path.stat().st_size)
    except Exception:
        directory.cleanup()
        raise


@router.post('/media')
async def media_download(request: DownloadRequest):
    parsed = urlparse(request.url)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        raise HTTPException(status_code=400, detail='Enter a valid http:// or https:// media URL')
    if request.kind not in {'video', 'audio'}:
        raise HTTPException(status_code=400, detail='Download kind must be video or audio')
    if request.quality not in {'best', '1080p', '720p', '420p'}:
        raise HTTPException(status_code=400, detail='Quality must be best, 1080p, 720p, or 420p')

    try:
        directory, media_path = await asyncio.to_thread(download_media_file, request.url, request.kind, request.quality)
        return FileResponse(
            media_path,
            media_type=mimetypes.guess_type(media_path.name)[0] or 'application/octet-stream',
            filename=media_path.name,
            background=BackgroundTask(directory.cleanup),
        )
    except Exception as error:
        message = str(error).strip() or 'The media provider could not serve this URL.'
        raise HTTPException(status_code=422, detail=f'Media download failed: {message}') from error
