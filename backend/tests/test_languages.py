import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.languages import (
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    get_supported_language_codes,
    resolve_language,
)

client = TestClient(app)

def test_language_configuration_recognizes_all_six_codes():
    """Test 2 — Language configuration: Application recognizes en, hi, bn, ta, mr, te."""
    required_codes = ["en", "hi", "bn", "ta", "mr", "te"]
    supported_codes = get_supported_language_codes()
    
    for code in required_codes:
        assert code in supported_codes, f"Language code {code} must be supported"
        assert code in SUPPORTED_LANGUAGES, f"{code} missing in SUPPORTED_LANGUAGES"
        assert SUPPORTED_LANGUAGES[code]["native_name"], f"{code} missing native name"
    
    # Also verify via API endpoint
    response = client.get("/api/v1/languages")
    assert response.status_code == 200
    langs = response.json()
    returned_codes = [l["code"] for l in langs]
    for code in required_codes:
        assert code in returned_codes

def test_unsupported_language_falls_back_to_english():
    """Test 3 — Unsupported language: Set language to 'fr', falls back to English ('en')."""
    resolved = resolve_language("fr")
    assert resolved == DEFAULT_LANGUAGE
    assert resolved == "en"

    # Other unsupported languages and malformed inputs
    assert resolve_language("de") == "en"
    assert resolve_language("es") == "en"
    assert resolve_language("") == "en"
    assert resolve_language(None) == "en"

    # API endpoint check
    response = client.get("/api/v1/languages/resolve?code=fr")
    assert response.status_code == 200
    data = response.json()
    assert data["requested"] == "fr"
    assert data["resolved"] == "en"
    assert data["details"]["code"] == "en"

def test_supported_language_resolution_with_locale_dialects():
    """Verify that locale dialects like 'hi-IN' resolve correctly to 'hi'."""
    assert resolve_language("hi-IN") == "hi"
    assert resolve_language("bn-BD") == "bn"
    assert resolve_language("ta-IN") == "ta"
    assert resolve_language("mr_IN") == "mr"
    assert resolve_language("te-IN") == "te"
    assert resolve_language("en-US") == "en"
