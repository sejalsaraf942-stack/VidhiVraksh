import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_returns_200_and_json():
    """Test 1 — Backend health: GET /health returns HTTP 200 and valid JSON."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"
    assert "app" in data
    assert "version" in data
    assert "environment" in data
