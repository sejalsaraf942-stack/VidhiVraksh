from pydantic import BaseModel
from typing import Dict, List, Optional

SUPPORTED_LANGUAGES: Dict[str, Dict[str, str]] = {
    "en": {"code": "en", "name": "English", "native_name": "English", "script": "Latin"},
    "hi": {"code": "hi", "name": "Hindi", "native_name": "हिन्दी", "script": "Devanagari"},
    "bn": {"code": "bn", "name": "Bengali", "native_name": "বাংলা", "script": "Bengali"},
    "ta": {"code": "ta", "name": "Tamil", "native_name": "தமிழ்", "script": "Tamil"},
    "mr": {"code": "mr", "name": "Marathi", "native_name": "मराठी", "script": "Devanagari"},
    "te": {"code": "te", "name": "Telugu", "native_name": "తెలుగు", "script": "Telugu"},
}

DEFAULT_LANGUAGE: str = "en"

class LanguageInfo(BaseModel):
    code: str
    name: str
    native_name: str
    script: str

def get_supported_language_codes() -> List[str]:
    return list(SUPPORTED_LANGUAGES.keys())

def get_supported_languages() -> List[LanguageInfo]:
    return [LanguageInfo(**info) for info in SUPPORTED_LANGUAGES.values()]

def resolve_language(lang_code: Optional[str]) -> str:
    """
    Resolves the provided language code against the supported languages list.
    If the code is not supported, empty, or invalid, falls back to DEFAULT_LANGUAGE ('en').
    """
    if not lang_code:
        return DEFAULT_LANGUAGE
    
    # Normalize e.g. 'en-US' -> 'en', 'hi-IN' -> 'hi'
    cleaned = lang_code.strip().lower()
    base = cleaned.split("-")[0].split("_")[0]
    
    if base in SUPPORTED_LANGUAGES:
        return base
        
    return DEFAULT_LANGUAGE
