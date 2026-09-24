from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.routers import pdf
from backend.routes.image_tools import router as image_router
from backend.routes.batch import router as batch_router
from backend.routers.download import router as downloads_router
from backend.services.cleanup import start_cleanup_worker

app = FastAPI(title='Format Studio API', version='0.1.0')
app.add_middleware(CORSMiddleware, allow_origins=['https://ninjaa.me', 'https://www.ninjaa.me', 'https://format-studio.onrender.com', 'http://localhost:3000', 'http://127.0.0.1:3000'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.include_router(pdf.router)
app.include_router(image_router, prefix='/api/image', tags=['image'])
app.include_router(batch_router, prefix='/api/batch', tags=['batch'])
app.include_router(downloads_router, prefix='/api/downloads', tags=['downloads'])

@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, str) else 'Request failed'
    return JSONResponse(status_code=exc.status_code, content={'error': detail})

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={'error': 'Request validation failed', 'details': exc.errors()})

@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={'error': 'Internal server error'})

@app.on_event('startup')
async def startup(): start_cleanup_worker()

@app.get('/')
async def root():
    return {'status': 'ok', 'service': 'format-studio', 'health': '/health'}

@app.get('/health')
async def health(): return {'status': 'ok', 'service': 'format-studio'}
