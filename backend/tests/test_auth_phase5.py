import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db import get_connection, verify_password

client = TestClient(app)

def test_1_signup_new_user_success():
    """Test 1: New email and matching valid password creates account in SQLite without OTP."""
    email = f"rajesh_{uuid.uuid4().hex[:8]}@example.test"
    password = "StrongPassword2026!"
    resp = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": password,
        "confirm_password": password,
        "name": "Rajesh Patel",
        "role": "citizen",
        "language": "hi",
        "remember_me": True
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == email
    assert data["user"]["name"] == "Rajesh Patel"
    assert data["user"]["language"] == "hi"

    # Security check: Password and hash are never returned in response
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]

    # Verify stored in SQLite and hashed
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT password_hash FROM users WHERE email = ?", (email,))
    row = c.fetchone()
    conn.close()
    assert row is not None
    assert row["password_hash"] is not None
    assert row["password_hash"] != password
    assert verify_password(password, row["password_hash"])

def test_2_duplicate_signup_returns_exact_user_alredy_exists():
    """Test 2: Duplicate registration produces exact error 'USER ALREADY EXISTS' without overwriting."""
    email = f"duplicate_{uuid.uuid4().hex[:8]}@example.test"
    orig_password = "OriginalPassword123!"

    # First registration
    resp1 = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": orig_password,
        "confirm_password": orig_password,
        "name": "Original User"
    })
    assert resp1.status_code == 200

    # Attempt duplicate registration with a different password
    attacker_password = "AttackerPassword999!"
    resp2 = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": attacker_password,
        "confirm_password": attacker_password,
        "name": "Attacker User"
    })
    assert resp2.status_code == 400
    # Must be character-for-character 'USER ALREADY EXISTS'
    assert resp2.json()["detail"] == "USER ALREADY EXISTS"

    # Verify original password was NOT overwritten
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT password_hash FROM users WHERE email = ?", (email,))
    row = c.fetchone()
    conn.close()
    assert verify_password(orig_password, row["password_hash"])
    assert not verify_password(attacker_password, row["password_hash"])

def test_3_signup_validation_errors():
    """Test 3: Invalid emails, short passwords, and mismatched passwords rejected."""
    # Invalid email
    r1 = client.post("/api/v1/auth/signup", json={
        "email": "invalid-email-no-at",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert r1.status_code == 400

    # Short password (< 6 chars)
    r2 = client.post("/api/v1/auth/signup", json={
        "email": "valid@example.test",
        "password": "123",
        "confirm_password": "123"
    })
    assert r2.status_code == 400

    # Mismatched passwords
    r3 = client.post("/api/v1/auth/signup", json={
        "email": "valid2@example.test",
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!"
    })
    assert r3.status_code == 400
    assert "match" in r3.json()["detail"].lower()

    # Empty password
    r4 = client.post("/api/v1/auth/signup", json={
        "email": "valid3@example.test",
        "password": "   ",
        "confirm_password": "   "
    })
    assert r4.status_code == 400

def test_4_signup_privilege_escalation_blocked():
    """Test 4: Users cannot assign themselves privileged roles like admin or lawyer."""
    resp = client.post("/api/v1/auth/signup", json={
        "email": "hacker@example.test",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "admin"
    })
    assert resp.status_code == 403
    assert "privileged" in resp.json()["detail"].lower()

def test_5_login_with_valid_credentials_success():
    """Test 5: Valid email and password logs in successfully without OTP."""
    email = f"login_{uuid.uuid4().hex[:8]}@example.test"
    password = "ValidUserPassword123!"

    # Sign up
    client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": password,
        "confirm_password": password,
    })

    # Log in
    resp = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
        "remember_me": True
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == email

    # Verify session cookie was set
    assert "vidhivraksh_session" in resp.cookies
    token = resp.cookies["vidhivraksh_session"]
    assert len(token) > 20

def test_6_login_with_incorrect_password_rejected():
    """Test 6: Login with incorrect password returns 401 generic error."""
    resp = client.post("/api/v1/auth/login", json={
        "email": "aarav@example.test",
        "password": "DefinitelyWrongPassword!"
    })
    assert resp.status_code == 401
    assert "invalid" in resp.json()["detail"].lower()

def test_7_login_with_unknown_email_rejected():
    """Test 7: Login with unregistered email returns generic 401 error."""
    resp = client.post("/api/v1/auth/login", json={
        "email": "unknown.ghost.user@example.test",
        "password": "SomePassword123!"
    })
    assert resp.status_code == 401
    assert "invalid" in resp.json()["detail"].lower()

def test_8_session_restoration_and_cookie_protection():
    """Test 8: Authenticated endpoints work with session cookie and reject unauthenticated."""
    email = f"cookie_{uuid.uuid4().hex[:8]}@example.test"
    password = "CookiePassword123!"

    resp = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": password,
        "confirm_password": password
    })
    assert resp.status_code == 200
    cookie_token = resp.cookies["vidhivraksh_session"]

    # Use cookie to access /auth/me
    client.cookies.set("vidhivraksh_session", cookie_token)
    me_resp = client.get("/api/v1/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email

    # Sign out clears cookie and invalidates session
    signout_resp = client.post("/api/v1/auth/signout")
    assert signout_resp.status_code == 200

    # Clear client cookies
    client.cookies.clear()
    unauth_resp = client.get("/api/v1/auth/me")
    assert unauth_resp.status_code == 401

def test_9_brand_name_vidhivraksh_in_metadata():
    """Test 9: Health and public config report VIDHIVRAKSH as product name."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "VIDHIVRAKSH" in resp.json()["app"]

    cfg_resp = client.get("/api/v1/config/public")
    assert cfg_resp.status_code == 200
    assert "VIDHIVRAKSH" in cfg_resp.json()["app_name"]
