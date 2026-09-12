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
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Optional native tools: install LibreOffice and Tesseract, then configure `TESSERACT_CMD` if Tesseract is not on PATH. `rembg` downloads its model on first use.

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local` when connecting the UI to the API.
