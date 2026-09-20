from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.pdf_tools import router as pdf_router
from backend.routes.image_tools import router as image_router
from backend.routes.batch import router as batch_router
from backend.routes.downloads import router as downloads_router
from backend.services.cleanup import start_cleanup_worker

app = FastAPI(title='Format Studio API', version='0.1.0')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:3000', 'http://192.168.10.105:3000', 'https://format-studio.onrender.com'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.include_router(pdf_router, prefix='/api/pdf', tags=['pdf'])
app.include_router(image_router, prefix='/api/image', tags=['image'])
app.include_router(batch_router, prefix='/api/batch', tags=['batch'])
app.include_router(downloads_router, prefix='/api/downloads', tags=['downloads'])

@app.on_event('startup')
async def startup(): start_cleanup_worker()

@app.get('/')
async def root():
    return {'status': 'ok', 'service': 'format-studio', 'health': '/health'}

@app.get('/health')
async def health(): return {'status': 'ok', 'service': 'format-studio'}
