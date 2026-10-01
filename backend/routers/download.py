from fastapi import APIRouter
from fastapi.responses import JSONResponse
from yt_dlp import YoutubeDL

router = APIRouter()


@router.get('/download')
async def download_media(url: str):
    try:
        options = {
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
            'http_headers': {
                'User-Agent': (
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) '
                    'Chrome/131.0.0.0 Safari/537.36'
                ),
            },
            'extractor_args': {
                'youtube': {'player_client': ['ios', 'android', 'mweb']},
            },
        }
        with YoutubeDL(options) as downloader:
            info = downloader.extract_info(url, download=False)

        return {
            'status': 'success',
            'title': info.get('title'),
            'thumbnail': info.get('thumbnail'),
            'duration': info.get('duration'),
            'download_url': info.get('url'),
            'ext': info.get('ext'),
        }
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={'status': 'error', 'message': str(error)},
        )
