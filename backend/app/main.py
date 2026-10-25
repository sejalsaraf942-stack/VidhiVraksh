from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict

from app.config import settings, get_public_config
from app.languages import (
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    LanguageInfo,
    get_supported_languages,
    get_supported_language_codes,
    resolve_language,
)
from app.db import init_db
from app.routes import router

# Initialize SQLite database schema and seed data
init_db()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Deterministic multilingual legal-awareness assistant API for India",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Authentication, Conversations, and Documents routes
app.include_router(router)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }

@app.get("/api/v1/languages", response_model=List[LanguageInfo])
def list_languages():
    """Return all supported Indian languages with their codes, English, and native names."""
    return get_supported_languages()

@app.get("/api/v1/languages/resolve")
def resolve_lang(code: Optional[str] = Query(None, description="Language code to resolve")):
    """Resolves any language code or browser locale string to a supported code or fallback ('en')."""
    resolved = resolve_language(code)
    return {
        "requested": code,
        "resolved": resolved,
        "supported": resolved in SUPPORTED_LANGUAGES,
        "details": SUPPORTED_LANGUAGES[resolved],
    }

@app.get("/api/v1/config/public")
def public_config():
    """Returns safe client-facing configuration. Secrets are never exposed."""
    return get_public_config()
