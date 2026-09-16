# Format Studio

An open-source file processing workspace for document conversion, OCR, background removal, batch jobs, image editing, and privacy-first image compression.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Run the backend

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

Optional native tools: install LibreOffice and Tesseract, then configure `TESSERACT_CMD` if Tesseract is not on PATH. `rembg` downloads its model on first use.

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local` when connecting the UI to the API.

## Deploy the backend to Render

The repository includes `render.yaml` for a Render Blueprint deployment. For an existing Render web service, use these settings:

```text
Root Directory: .
Build Command: pip install -r requirements.txt
Start Command: python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```
