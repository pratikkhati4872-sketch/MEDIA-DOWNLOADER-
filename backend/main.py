import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import download, pdf

app = FastAPI(title='CyberVault API')

default_origins = [
    'https://ninjaa.me',
    'https://www.ninjaa.me',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
allowed_origins = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOW_ORIGINS', ','.join(default_origins)).split(',')
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(download.router, prefix='/api')
app.include_router(pdf.router, prefix='/api')


@app.get('/')
async def root():
    return {'status': 'online', 'system': 'CyberVault API'}


@app.get('/health')
async def health():
    return {'status': 'ok'}
