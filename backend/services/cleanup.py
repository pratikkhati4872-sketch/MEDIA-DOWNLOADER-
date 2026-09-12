import asyncio
from datetime import datetime, timedelta
from pathlib import Path

STORAGE = Path(__file__).parents[1] / 'storage'

def purge_old_files():
    if not STORAGE.exists(): return
    cutoff = datetime.now().timestamp() - timedelta(minutes=15).total_seconds()
    for path in STORAGE.iterdir():
        if path.is_file() and path.stat().st_mtime < cutoff: path.unlink(missing_ok=True)

async def _worker():
    while True:
        purge_old_files(); await asyncio.sleep(60)

def start_cleanup_worker():
    asyncio.create_task(_worker())
