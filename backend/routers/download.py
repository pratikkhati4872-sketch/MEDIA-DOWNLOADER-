import asyncio
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class DownloadRequest(BaseModel):
    url: str
    kind: str = 'video'
    quality: str = 'best'


def extract_media_info(url: str, kind: str, quality: str) -> dict[str, str | None]:
    from yt_dlp import YoutubeDL

    max_height = {'1080p': 1080, '720p': 720, '420p': 420}.get(quality)
    height_filter = f'[height<={max_height}]' if max_height else ''
    options = {
        'noplaylist': True,
        'skip_download': True,
        'extractor_args': {'youtube': {'player_client': ['android', 'ios']}},
        'format': 'bestaudio/best' if kind == 'audio' else f'best{height_filter}[ext=mp4]/best{height_filter}/best',
        'quiet': True,
        'no_warnings': True,
    }
    with YoutubeDL(options) as downloader:
        info = downloader.extract_info(url, download=False)

    stream_url = info.get('url')
    if not stream_url:
        raise RuntimeError('The downloader did not provide a direct stream URL.')
    return {
        'url': stream_url,
        'title': info.get('title'),
        'thumbnail': info.get('thumbnail'),
        'extension': info.get('ext'),
    }


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
        return await asyncio.to_thread(extract_media_info, request.url, request.kind, request.quality)
    except Exception as error:
        raise HTTPException(status_code=422, detail=f'Media download failed: {error}') from error
