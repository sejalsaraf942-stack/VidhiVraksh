import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db, get_connection

client = TestClient(app)

def test_1_successful_mock_otp_verification():
    """Test 1: Request mock OTP and verify with valid code '123456'."""
    email = "citizen.test@example.test"
    # Request OTP
    req_resp = client.post("/api/v1/auth/otp/request", json={"email": email})
    assert req_resp.status_code == 200
    data = req_resp.json()
    assert data["status"] == "ok"
    assert data["mock_otp"] == "123456"

    # Verify OTP
    verify_resp = client.post("/api/v1/auth/otp/verify", json={
        "email": email,
        "code": "123456",
        "name": "Rohan Verma",
        "language": "hi",
    })
    assert verify_resp.status_code == 200
    v_data = verify_resp.json()
    assert "access_token" in v_data
    assert v_data["user"]["email"] == email
    assert v_data["user"]["name"] == "Rohan Verma"
    assert v_data["user"]["language"] == "hi"
    assert v_data["user"]["role"] == "citizen"

def test_2_invalid_otp_rejected():
    """Test 2: Invalid OTP is rejected with HTTP 400."""
    email = "test.invalid@example.test"
    client.post("/api/v1/auth/otp/request", json={"email": email})

    # Wrong code
    bad_resp = client.post("/api/v1/auth/otp/verify", json={
        "email": email,
        "code": "999999",
    })
    assert bad_resp.status_code == 400
    assert "Invalid OTP" in bad_resp.json()["detail"]

def test_3_successful_signin_and_signout():
    """Test 3: Demo account sign in, access protected me endpoint, and sign out."""
    # Aarav Sharma demo account sign in via OTP
    client.post("/api/v1/auth/otp/request", json={"email": "aarav@example.test"})
    verify = client.post("/api/v1/auth/otp/verify", json={
        "email": "aarav@example.test",
        "code": "123456",
    })
    assert verify.status_code == 200
    token = verify.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify protected /auth/me
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "aarav@example.test"
    assert me_resp.json()["id"] == "user_demo_001"

    # Sign out
    signout_resp = client.post("/api/v1/auth/signout", headers=headers)
    assert signout_resp.status_code == 200
    assert signout_resp.json()["status"] == "ok"

def test_4_protected_endpoints_reject_unauthenticated():
    """Test 4: Protected endpoints reject requests without token or with malformed token."""
    # No token
    res1 = client.get("/api/v1/auth/me")
    assert res1.status_code == 401

    res2 = client.get("/api/v1/conversations")
    assert res2.status_code == 401

    res3 = client.get("/api/v1/documents")
    assert res3.status_code == 401

    # Malformed token
    res4 = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
    assert res4.status_code == 401

def test_5_language_preference_persists():
    """Test 5: Authenticated user updates language preference, and it persists in account."""
    email = "lang.user@example.test"
    client.post("/api/v1/auth/otp/request", json={"email": email})
    verify = client.post("/api/v1/auth/otp/verify", json={
        "email": email,
        "code": "123456",
        "language": "en"
    })
    token = verify.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update language to Tamil ('ta')
    patch_resp = client.patch("/api/v1/auth/profile", json={"language": "ta"}, headers=headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["language"] == "ta"

    # Fetch profile again to confirm persistence
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["language"] == "ta"

def test_6_new_users_default_to_normal_mode():
    """Test 6: New users default strictly to Normal mode."""
    email = "new.citizen@example.test"
    client.post("/api/v1/auth/otp/request", json={"email": email})
    verify = client.post("/api/v1/auth/otp/verify", json={
        "email": email,
        "code": "123456",
    })
    user = verify.json()["user"]
    assert user["mode"] == "normal"
    assert user["subscription"] == "free"

def test_7_users_cannot_assign_themselves_privileged_roles():
    """Test 7: Attempting to self-assign 'admin' or 'lawyer' during signup is rejected with HTTP 403."""
    # Attempt admin
    client.post("/api/v1/auth/otp/request", json={"email": "hacker@example.test"})
    admin_attempt = client.post("/api/v1/auth/otp/verify", json={
        "email": "hacker@example.test",
        "code": "123456",
        "role": "admin"
    })
    assert admin_attempt.status_code == 403
    assert "privileged role" in admin_attempt.json()["detail"].lower()

    # Attempt lawyer
    client.post("/api/v1/auth/otp/request", json={"email": "fake.lawyer@example.test"})
    lawyer_attempt = client.post("/api/v1/auth/otp/verify", json={
        "email": "fake.lawyer@example.test",
        "code": "123456",
        "role": "lawyer"
    })
    assert lawyer_attempt.status_code == 403
    assert "privileged role" in lawyer_attempt.json()["detail"].lower()

def test_8_users_cannot_access_another_users_data():
    """Test 8: Strict ownership enforcement prevents User B from accessing User A's data."""
    # User A (Aarav Sharma - seeded conv_demo_001 and doc_demo_001)
    client.post("/api/v1/auth/otp/request", json={"email": "aarav@example.test"})
    token_a = client.post("/api/v1/auth/otp/verify", json={"email": "aarav@example.test", "code": "123456"}).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User B
    client.post("/api/v1/auth/otp/request", json={"email": "user_b@example.test"})
    token_b = client.post("/api/v1/auth/otp/verify", json={"email": "user_b@example.test", "code": "123456"}).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A can view their conversation and document
    conv_a = client.get("/api/v1/conversations/conv_demo_001", headers=headers_a)
    assert conv_a.status_code == 200
    doc_a = client.get("/api/v1/documents/doc_demo_001", headers=headers_a)
    assert doc_a.status_code == 200

    # User B attempts to access User A's conversation -> FORBIDDEN (403)
    conv_b_attempt = client.get("/api/v1/conversations/conv_demo_001", headers=headers_b)
    assert conv_b_attempt.status_code == 403

    # User B attempts to access User A's document -> FORBIDDEN (403)
    doc_b_attempt = client.get("/api/v1/documents/doc_demo_001", headers=headers_b)
    assert doc_b_attempt.status_code == 403

def test_9_seeded_data_persists_after_restart():
    """Test 9: Seeded demo data exists in SQLite database and persists across re-inits."""
    # Re-trigger init_db (simulating app restart)
    init_db()

    conn = get_connection()
    cursor = conn.cursor()

    # Check Aarav Sharma demo user
    cursor.execute("SELECT * FROM users WHERE id = 'user_demo_001'")
    row_user = cursor.fetchone()
    assert row_user is not None
    assert row_user["name"] == "Aarav Sharma"
    assert row_user["role"] == "citizen"

    # Check Priya Iyer lawyer demo user
    cursor.execute("SELECT * FROM users WHERE id = 'user_demo_002'")
    row_lawyer = cursor.fetchone()
    assert row_lawyer is not None
    assert row_lawyer["role"] == "lawyer"

    # Check seeded conversation and message
    cursor.execute("SELECT * FROM conversations WHERE id = 'conv_demo_001'")
    assert cursor.fetchone() is not None

    cursor.execute("SELECT * FROM messages WHERE conversation_id = 'conv_demo_001'")
    assert len(cursor.fetchall()) >= 2

    # Check seeded document
    cursor.execute("SELECT * FROM uploaded_documents WHERE id = 'doc_demo_001'")
    assert cursor.fetchone() is not None

    conn.close()
