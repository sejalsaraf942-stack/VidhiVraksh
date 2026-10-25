import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db import get_connection

client = TestClient(app)

def test_1_duplicate_registration_error_exact_user_already_exists():
    """Verify duplicate registration returns exact uppercase string 'USER ALREADY EXISTS'."""
    test_email = f"user_{uuid.uuid4().hex[:8]}@example.test"
    pw = "SecretPass123!"

    # First sign up
    r1 = client.post("/api/v1/auth/signup", json={
        "email": test_email,
        "password": pw,
        "confirm_password": pw,
        "name": "Original User",
        "role": "citizen"
    })
    assert r1.status_code == 200

    # Second sign up with same email
    r2 = client.post("/api/v1/auth/signup", json={
        "email": test_email,
        "password": "OtherPassword999!",
        "confirm_password": "OtherPassword999!",
        "name": "Duplicate User",
        "role": "citizen"
    })
    assert r2.status_code == 400
    assert r2.json()["detail"] == "USER ALREADY EXISTS"


def test_2_legal_document_library_listing_and_filter():
    """Verify legal documents can be searched and filtered by category and doc_type."""
    # List all documents
    r = client.get("/api/v1/library/documents")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 10
    assert len(data["documents"]) >= 10

    # Filter by category: property
    r_prop = client.get("/api/v1/library/documents?category=property")
    assert r_prop.status_code == 200
    prop_data = r_prop.json()
    assert prop_data["total"] >= 2
    for d in prop_data["documents"]:
        assert d["category"] == "property"

    # Search keyword: 'lease'
    r_search = client.get("/api/v1/library/documents?q=lease")
    assert r_search.status_code == 200
    search_data = r_search.json()
    assert search_data["total"] >= 1


def test_3_legal_document_detail_and_disclaimer():
    """Verify document detail endpoint returns parsed clauses, risks, statutes, and sample warning."""
    r = client.get("/api/v1/library/documents/doc_rent_agreement_01")
    assert r.status_code == 200
    doc = r.json()
    assert doc["id"] == "doc_rent_agreement_01"
    assert "Rental" in doc["title"] or "Lease" in doc["title"]
    assert isinstance(doc["essential_clauses"], list)
    assert len(doc["essential_clauses"]) > 0
    assert isinstance(doc["key_risks"], list)
    assert "template_text" in doc
    assert "SAMPLE TEMPLATE — NOT VERIFIED FOR YOUR SPECIFIC SITUATION" in doc["disclaimer"]


def test_4_consistency_checker_passed_clean_text():
    """Verify deterministic consistency checker returns passed for clean text."""
    clean_text = "This Agreement is made on 01/11/2026 between Landlord Amit Kumar and Tenant Priya Verma. The rent is Rs. 15,000 per month."
    r = client.post("/api/v1/library/check-consistency", json={"text": clean_text})
    assert r.status_code == 200
    res = r.json()
    assert res["status"] == "passed"
    assert res["issue_count"] == 0
    assert "PRELIMINARY CONSISTENCY CHECK — NOT A CERTIFICATION OF LEGAL VALIDITY OR ENFORCEABILITY" in res["disclaimer"]


def test_5_consistency_checker_detects_structural_issues():
    """Verify checker catches unfilled placeholders, contradictory party terms, and amount discrepancies."""
    inconsistent_text = """
    This Agreement is made on [Date] between Landlord Amit and Lessee Rahul.
    Lessor agrees to let the premises for Rs. 25,000 (Rupees Twenty Four Thousand only).
    The deposit is Rs. __________ refundable on 15/10/2026.
    Term commences on 01/11/2026 and ends on 31/10/2027.
    """
    r = client.post("/api/v1/library/check-consistency", json={"text": inconsistent_text})
    assert r.status_code == 200
    res = r.json()
    assert res["status"] == "issues_detected"
    assert res["issue_count"] >= 3
    issue_types = [i["type"] for i in res["issues"]]
    assert "unfilled_placeholder" in issue_types
    assert "conflicting_party_designations" in issue_types
    assert "amount_discrepancy" in issue_types


def test_6_land_research_simulated_records_and_checklist():
    """Verify simulated land records and 6-step due diligence checklist."""
    r = client.get("/api/v1/land-research/simulated-examples")
    assert r.status_code == 200
    data = r.json()
    assert "DEMO MODE — PROPERTY RECORDS ARE SIMULATED AND OWNERSHIP HAS NOT BEEN VERIFIED." in data["notice"]
    assert len(data["simulated_records"]) == 3
    # Check fictional banner
    assert "FICTIONAL DEMONSTRATION DATA" in data["simulated_records"][0]["disclaimer"]
    # Check 6 steps
    assert len(data["educational_checklist"]) == 6
    assert data["educational_checklist"][0]["step"] == 1


def test_7_land_research_user_crud():
    """Verify user can create, list, and delete personal land research entries."""
    email = f"citizen_land_{uuid.uuid4().hex[:8]}@example.test"
    pw = "SecureUser123!"
    reg = client.post("/api/v1/auth/signup", json={
        "email": email, "password": pw, "confirm_password": pw,
        "name": "Land Buyer", "role": "citizen"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create entry
    create_r = client.post("/api/v1/land-research", headers=headers, json={
        "state": "Maharashtra",
        "district": "Pune",
        "locality": "Hinjawadi",
        "survey_number": "Plot 88/B",
        "property_description": "Residential Plot near IT Park",
        "verification_status": "in_progress"
    })
    assert create_r.status_code == 200
    entry_id = create_r.json()["id"]

    # 2. List entries
    list_r = client.get("/api/v1/land-research", headers=headers)
    assert list_r.status_code == 200
    entries = list_r.json()["entries"]
    assert any(e["id"] == entry_id for e in entries)

    # 3. Delete entry
    del_r = client.delete(f"/api/v1/land-research/{entry_id}", headers=headers)
    assert del_r.status_code == 200
    assert del_r.json()["success"] is True


def test_8_lawyer_role_access_control():
    """Verify citizen accounts get HTTP 403 Forbidden on lawyer endpoints, while lawyers get access."""
    # 1. Citizen login
    citizen_login = client.post("/api/v1/auth/login", json={
        "email": "aarav@example.test",
        "password": "DemoPass123!"
    })
    citizen_token = citizen_login.json()["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    # Citizen tries to access lawyer dashboard
    r_dash = client.get("/api/v1/cases/dashboard", headers=citizen_headers)
    assert r_dash.status_code == 403
    assert "Access restricted" in r_dash.json()["detail"]

    # Citizen tries to access lawyer cases
    r_cases = client.get("/api/v1/cases", headers=citizen_headers)
    assert r_cases.status_code == 403

    # 2. Lawyer login (Priya Iyer)
    lawyer_login = client.post("/api/v1/auth/login", json={
        "email": "priya.law@example.test",
        "password": "DemoPass123!"
    })
    assert lawyer_login.status_code == 200
    lawyer_token = lawyer_login.json()["access_token"]
    lawyer_headers = {"Authorization": f"Bearer {lawyer_token}"}

    # Lawyer accesses dashboard
    lawyer_dash = client.get("/api/v1/cases/dashboard", headers=lawyer_headers)
    assert lawyer_dash.status_code == 200
    dash_metrics = lawyer_dash.json()
    assert dash_metrics["active_cases"] >= 2
    assert dash_metrics["upcoming_deadlines"] >= 1
    assert dash_metrics["pending_tasks"] >= 1


def test_9_lawyer_case_full_workflow():
    """Verify lawyer can create a case, add timeline events, exhibits, notes, and tasks."""
    lawyer_login = client.post("/api/v1/auth/login", json={
        "email": "priya.law@example.test",
        "password": "DemoPass123!"
    })
    token = lawyer_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create new case
    case_num = f"ARB-{uuid.uuid4().hex[:6].upper()}/2026"
    new_c = client.post("/api/v1/cases", headers=headers, json={
        "case_number": case_num,
        "title": "Quantum AI v. NeoCloud Infra",
        "client_name": "Quantum AI Pvt Ltd",
        "court": "Delhi Arbitration Centre",
        "case_type": "Commercial Arbitration",
        "opposing_party": "NeoCloud Infra Ltd",
        "opposing_counsel": "Senior Adv. R. Malhotra",
        "stage": "Filing of Statement of Claim",
        "next_hearing_date": "2026-11-20",
        "summary": "Dispute arising from cloud infrastructure service level breach.",
        "status": "active"
    })
    assert new_c.status_code == 200
    case_id = new_c.json()["id"]

    # Add timeline event
    tl = client.post(f"/api/v1/cases/{case_id}/timeline", headers=headers, json={
        "event_date": "2026-10-25",
        "title": "Section 21 Arbitration Notice Dispatched",
        "description": "Notice invoking arbitration served via registered post and email."
    })
    assert tl.status_code == 200

    # Add evidence
    ev = client.post(f"/api/v1/cases/{case_id}/evidence", headers=headers, json={
        "title": "Master Services Agreement (MSA)",
        "document_type": "Contract",
        "bates_number": "Ex. C-1",
        "relevance": "Contains dispute resolution clause 18."
    })
    assert ev.status_code == 200

    # Add note
    nt = client.post(f"/api/v1/cases/{case_id}/notes", headers=headers, json={
        "title": "Limitation Period Analysis",
        "content": "Claim is well within 3 years under Article 55 of Limitation Act 1963."
    })
    assert nt.status_code == 200

    # Add task
    tk = client.post(f"/api/v1/cases/{case_id}/tasks", headers=headers, json={
        "title": "Finalize draft Statement of Claim",
        "due_date": "2026-11-10",
        "priority": "high"
    })
    assert tk.status_code == 200
    task_id = tk.json()["id"]

    # Toggle task status
    patch_tk = client.patch(f"/api/v1/cases/tasks/{task_id}", headers=headers, json={
        "is_completed": True
    })
    assert patch_tk.status_code == 200
    assert patch_tk.json()["is_completed"] is True

    # Retrieve full case details
    full_c = client.get(f"/api/v1/cases/{case_id}", headers=headers)
    assert full_c.status_code == 200
    c_data = full_c.json()
    assert len(c_data["timeline_events"]) == 1
    assert len(c_data["evidence_documents"]) == 1
    assert len(c_data["notes"]) == 1
    assert len(c_data["tasks"]) == 1
    assert c_data["tasks"][0]["is_completed"] is True
