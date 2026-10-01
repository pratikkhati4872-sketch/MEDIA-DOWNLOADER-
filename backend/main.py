from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import download, pdf

app = FastAPI(title='CyberVault API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'https://ninjaa.me',
        'https://www.ninjaa.me',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        '*',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(download.router, prefix='/api')
app.include_router(pdf.router, prefix='/api')


@app.get('/')
async def root():
    return {'status': 'online', 'system': 'CyberVault API'}
