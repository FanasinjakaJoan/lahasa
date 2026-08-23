from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .core.config import settings
from .api.routes.cin import router as cin_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    **Lahasa API** - Plateforme d'automatisation de la collecte CIN malgache
    
    Fonctionnalités:
    - OCR extraction (Tesseract / Mock)
    - Validation + Duplicate detection (exact + fuzzy)
    - QR Code generation (HMAC signé)
    - Offline sync batch
    - Upload sécurisé
    
    Flux: Capture → Preprocess OpenCV → OCR → Regex MG → Validation → QR
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS - permissif pour preview e2b + local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En prod, restreindre à settings.BACKEND_CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(cin_router, prefix=f"{settings.API_V1_STR}/cin", tags=["CIN"])

@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/cin/health",
        "message": "Lahasa API - Lahasa manamora ny fiainana"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "lahasa-api"}

# Serve uploads if exists
if os.path.exists(settings.UPLOAD_DIR):
    try:
        app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
    except Exception:
        pass

# Pour lancement direct
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
