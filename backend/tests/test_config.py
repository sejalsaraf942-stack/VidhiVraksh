import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings, get_public_config

client = TestClient(app)

def test_configuration_safety_no_server_secrets_in_public_endpoint():
    """Test 5 — Configuration safety: Server secrets are not exposed to the browser."""
    response = client.get("/api/v1/config/public")
    assert response.status_code == 200
    public_data = response.json()
    
    # Secrets that must NEVER be in public response
    sensitive_keys = [
        "SECRET_KEY", "secret_key", "secret", "password", 
        "ALGORITHM", "algorithm", "DATABASE_URL", "database_url",
        "ACCESS_TOKEN_EXPIRE_MINUTES"
    ]
    for key in sensitive_keys:
        assert key not in public_data, f"Sensitive key {key} leaked in public config!"
    
    # Values of secrets must not be in the values
    for val in public_data.values():
        assert val != settings.SECRET_KEY, "Secret key value found in public config response!"
        assert val != settings.DATABASE_URL, "Database URL found in public config response!"

def test_health_endpoint_does_not_leak_secrets():
    """Verify /health endpoint does not leak secrets."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "SECRET_KEY" not in data
    assert "secret_key" not in data
    assert settings.SECRET_KEY not in str(data)
