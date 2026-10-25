import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db import get_connection

client = TestClient(app)

def create_fresh_user():
    email = f"billing_user_{uuid.uuid4().hex[:8]}@example.test"
    pw = "StrongPass123!"
    r = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": pw,
        "confirm_password": pw,
        "name": "Billing Test User",
        "role": "citizen"
    })
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {
        "email": email,
        "password": pw,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }


def test_1_billing_plans_list():
    """Verify demo plans are returned with demonstration prices in INR."""
    r = client.get("/api/v1/billing/plans")
    assert r.status_code == 200
    data = r.json()
    assert "plans" in data
    assert len(data["plans"]) >= 2
    assert data["currency"] == "INR"
    assert "Prototype" in data["disclaimer"]

    plan_ids = [p["id"] for p in data["plans"]]
    assert "pro_legal" in plan_ids
    assert "advocate_suite" in plan_ids


def test_2_unentitled_user_blocked_from_setting_professional_mode():
    """Unentitled citizen attempting to set mode to professional receives HTTP 403."""
    user = create_fresh_user()

    # Attempt to switch to professional mode without entitlement
    r = client.patch("/api/v1/auth/profile", json={"mode": "professional"}, headers=user["headers"])
    assert r.status_code == 403
    assert "pricing" in r.json()["detail"].lower() or "entitlement" in r.json()["detail"].lower()


def test_3_entitlement_status_endpoint():
    """Check entitlement status for fresh citizen vs entitled lawyer."""
    user = create_fresh_user()
    r = client.get("/api/v1/billing/entitlement", headers=user["headers"])
    assert r.status_code == 200
    assert r.json()["is_entitled"] is False

    # Lawyer demo user (user_demo_002) is entitled
    lawyer_login = client.post("/api/v1/auth/login", json={
        "email": "priya.law@example.test",
        "password": "DemoPass123!"
    })
    assert lawyer_login.status_code == 200
    lawyer_token = lawyer_login.json()["access_token"]
    lawyer_headers = {"Authorization": f"Bearer {lawyer_token}"}

    r_lawyer = client.get("/api/v1/billing/entitlement", headers=lawyer_headers)
    assert r_lawyer.status_code == 200
    assert r_lawyer.json()["is_entitled"] is True


def test_4_simulated_checkout_flow_grants_entitlement():
    """User completes simulated checkout, which records entitlement and enables Professional Mode."""
    user = create_fresh_user()

    # Complete demo purchase
    checkout_r = client.post("/api/v1/billing/checkout", json={
        "plan_id": "pro_legal",
        "billing_interval": "monthly"
    }, headers=user["headers"])

    assert checkout_r.status_code == 200, checkout_r.text
    data = checkout_r.json()
    assert data["success"] is True
    assert data["entitlement"]["amount_inr"] == 499
    assert data["entitlement"]["is_simulated"] is True
    assert data["user"]["mode"] == "professional"
    assert data["user"]["is_pro_entitled"] is True

    # Verify database persistence
    conn = get_connection()
    row = conn.execute("SELECT is_pro_entitled, subscription, mode FROM users WHERE email = ?", (user["email"],)).fetchone()
    assert row["is_pro_entitled"] == 1
    assert row["subscription"] == "professional"
    assert row["mode"] == "professional"

    # Verify demo_entitlements record exists
    ent_row = conn.execute("SELECT * FROM demo_entitlements WHERE user_id = (SELECT id FROM users WHERE email = ?)", (user["email"],)).fetchone()
    assert ent_row is not None
    assert ent_row["plan_id"] == "pro_legal"
    assert ent_row["amount_inr"] == 499
    conn.close()

    # Verify entitlement endpoint now reports True
    status_r = client.get("/api/v1/billing/entitlement", headers=user["headers"])
    assert status_r.status_code == 200
    assert status_r.json()["is_entitled"] is True

    # Entitled user can now toggle between normal and professional mode seamlessly
    r_norm = client.patch("/api/v1/auth/profile", json={"mode": "normal"}, headers=user["headers"])
    assert r_norm.status_code == 200
    assert r_norm.json()["mode"] == "normal"

    r_pro = client.patch("/api/v1/auth/profile", json={"mode": "professional"}, headers=user["headers"])
    assert r_pro.status_code == 200
    assert r_pro.json()["mode"] == "professional"


def test_5_legal_case_corpus_contains_30_unique_records():
    """Verify that exactly 30 unique, verified landmark judgments are present in database."""
    conn = get_connection()
    rows = conn.execute("SELECT id, case_title, citation, year, court, key_holding, official_url FROM legal_case_records").fetchall()
    conn.close()

    assert len(rows) == 30
    unique_ids = {r["id"] for r in rows}
    assert len(unique_ids) == 30

    titles = [r["case_title"] for r in rows]
    # Check key landmark cases are present
    assert any("Kesavananda" in t for t in titles)
    assert any("Maneka Gandhi" in t for t in titles)
    assert any("Puttaswamy" in t for t in titles)
    assert any("Vishaka" in t for t in titles)
    assert any("D.K. Basu" in t for t in titles)
    assert any("Shreya Singhal" in t for t in titles)
    assert any("Navtej Singh Johar" in t for t in titles)
    assert any("Shayara Bano" in t for t in titles)
    assert any("Common Cause" in t for t in titles)
    assert any("Anuradha Bhasin" in t for t in titles)
    assert any("Democratic Reforms" in t for t in titles)
    assert any("NALSA" in t for t in titles)


def test_6_retrieval_finds_landmark_precedents():
    """Verify search queries retrieve the correct grounded landmark decisions."""
    user = create_fresh_user()

    # Query 1: Basic Structure
    r1 = client.post("/api/v1/chat/message", json={
        "content": "What did the Supreme Court rule in Kesavananda Bharati regarding basic structure?",
        "mode": "professional",
        "language": "en"
    }, headers=user["headers"])
    assert r1.status_code == 200
    data1 = r1.json()
    assert "Kesavananda" in data1["assistant_message"]["content"]
    assert "Basic Structure" in data1["assistant_message"]["content"]

    # Query 2: Privacy
    r2 = client.post("/api/v1/chat/message", json={
        "content": "Explain the Puttaswamy judgment on right to privacy under Article 21",
        "mode": "normal",
        "language": "en"
    }, headers=user["headers"])
    assert r2.status_code == 200
    data2 = r2.json()
    assert "Puttaswamy" in data2["assistant_message"]["content"]
    assert "Privacy" in data2["assistant_message"]["content"] or "privacy" in data2["assistant_message"]["content"]

    # Query 3: Electoral bonds
    r3 = client.post("/api/v1/chat/message", json={
        "content": "Why were electoral bonds declared unconstitutional by Supreme Court?",
        "mode": "normal",
        "language": "en"
    }, headers=user["headers"])
    assert r3.status_code == 200
    data3 = r3.json()
    assert "Electoral" in data3["assistant_message"]["content"] or "bonds" in data3["assistant_message"]["content"].lower()
