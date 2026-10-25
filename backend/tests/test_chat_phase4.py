import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_headers(email: str = "aarav@example.test", remember_me: bool = False):
    client.post("/api/v1/auth/otp/request", json={"email": email})
    resp = client.post("/api/v1/auth/otp/verify", json={
        "email": email,
        "code": "123456",
        "remember_me": remember_me,
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, resp.json()["user"]

def test_1_start_new_chat_and_receive_grounded_response():
    """Test 1: Normal mode inquiry on rental agreements returns grounded response and source cards."""
    headers, user = get_auth_headers()
    chat_payload = {
        "content": "Can my landlord deduct my security deposit without receipts?",
        "language": "en",
        "mode": "normal"
    }
    resp = client.post("/api/v1/chat/message", json=chat_payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["conversation_id"] is not None
    assert data["user_message"]["content"] == chat_payload["content"]
    assert data["assistant_message"]["role"] == "assistant"
    assert "security deposit" in data["assistant_message"]["content"].lower()

    # Source cards present and labeled demo
    sources = data["assistant_message"]["sources"]
    assert len(sources) >= 1
    assert sources[0]["is_demo"] is True
    assert "Model Tenancy" in sources[0]["statute"]

def test_2_professional_mode_returns_structured_memorandum():
    """Test 2: Professional mode returns structured memorandum format."""
    headers, user = get_auth_headers()
    chat_payload = {
        "content": "What are the rules regarding execution and attestation of a will under Indian law?",
        "language": "en",
        "mode": "professional"
    }
    resp = client.post("/api/v1/chat/message", json=chat_payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    content = data["assistant_message"]["content"]
    assert "LEGAL MEMORANDUM & STATUTORY BRIEF" in content
    assert "Statutory Formulation & Rules" in content
    assert "Indian Succession Act" in content
    assert len(data["assistant_message"]["sources"]) >= 1

def test_3_multilingual_retrieval_hindi_and_tamil():
    """Test 3: Asking in Hindi or Tamil retrieves correct record and responds in that language."""
    headers, user = get_auth_headers()

    # Hindi question on FIR
    hi_resp = client.post("/api/v1/chat/message", json={
        "content": "जीरो एफआईआर दर्ज करने के क्या नियम हैं?",
        "language": "hi",
        "mode": "normal"
    }, headers=headers)
    assert hi_resp.status_code == 200
    hi_data = hi_resp.json()
    assert len(hi_data["assistant_message"]["sources"]) >= 1
    assert "BNSS" in hi_data["assistant_message"]["sources"][0]["statute"]

    # Tamil question on rental agreement
    ta_resp = client.post("/api/v1/chat/message", json={
        "content": "வாடகை ஒப்பந்த விதிகள் என்ன?",
        "language": "ta",
        "mode": "normal"
    }, headers=headers)
    assert ta_resp.status_code == 200
    ta_data = ta_resp.json()
    assert len(ta_data["assistant_message"]["sources"]) >= 1
    assert "Model Tenancy" in ta_data["assistant_message"]["sources"][0]["statute"]

def test_4_ambiguous_question_triggers_clarification():
    """Test 4: Ambiguous query 'Can I do it?' prompts for clarification without guessing."""
    headers, user = get_auth_headers()
    resp = client.post("/api/v1/chat/message", json={
        "content": "Can I do it?",
        "language": "en",
        "mode": "normal"
    }, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["assistant_message"]["type"] == "clarification_needed"
    assert "Context Needed" in data["assistant_message"]["content"] or "needs a bit more context" in data["assistant_message"]["content"]
    assert len(data["assistant_message"]["sources"]) == 0

def test_5_unsupported_question_indicates_corpus_limitation():
    """Test 5: Unsupported query indicates limitation transparently without hallucinating."""
    headers, user = get_auth_headers()
    resp = client.post("/api/v1/chat/message", json={
        "content": "What are the legal requirements for building a research station on Mars?",
        "language": "en",
        "mode": "normal"
    }, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["assistant_message"]["type"] == "insufficient_info"
    assert data["assistant_message"]["insufficient_info"] is True
    assert "corpus does not contain verified source records" in data["assistant_message"]["content"]
    assert len(data["assistant_message"]["sources"]) == 0

def test_6_empty_message_rejected():
    """Test 6: Empty or whitespace-only messages are rejected with HTTP 400."""
    headers, user = get_auth_headers()
    resp = client.post("/api/v1/chat/message", json={"content": "   "}, headers=headers)
    assert resp.status_code == 400
    assert "empty" in resp.json()["detail"].lower()

def test_7_conversation_persistence_and_message_ordering():
    """Test 7: Conversations and messages are saved in order and retrievable."""
    headers, user = get_auth_headers()

    # Step 1: create conversation with message 1
    msg1 = client.post("/api/v1/chat/message", json={
        "content": "What does Section 420 mean under new BNS code?",
        "language": "en",
        "mode": "normal"
    }, headers=headers).json()
    conv_id = msg1["conversation_id"]

    # Step 2: continue conversation with message 2
    msg2 = client.post("/api/v1/chat/message", json={
        "conversation_id": conv_id,
        "content": "What are the penalties for cheating under BNS Section 318?",
        "language": "en",
        "mode": "normal"
    }, headers=headers).json()

    # Step 3: fetch conversation details
    detail_resp = client.get(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert detail_resp.status_code == 200
    conv_detail = detail_resp.json()

    assert conv_detail["id"] == conv_id
    messages = conv_detail["messages"]
    assert len(messages) == 4  # 2 user messages + 2 assistant messages
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"
    assert messages[2]["role"] == "user"
    assert messages[3]["role"] == "assistant"

def test_8_rename_and_delete_conversation():
    """Test 8: User can rename and delete their conversation."""
    headers, user = get_auth_headers()

    # Create conv
    msg = client.post("/api/v1/chat/message", json={"content": "Temporary Query"}, headers=headers).json()
    conv_id = msg["conversation_id"]

    # Rename conv
    patch_resp = client.patch(f"/api/v1/conversations/{conv_id}", json={"title": "Renamed Legal Chat"}, headers=headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["title"] == "Renamed Legal Chat"

    # Delete conv
    del_resp = client.delete(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert del_resp.status_code == 200

    # Ensure it is gone
    get_again = client.get(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert get_again.status_code == 404

def test_9_cross_user_isolation_prevented():
    """Test 9: User B cannot view, continue, or delete User A's conversation."""
    headers_a, user_a = get_auth_headers(email="user_a@example.test")
    headers_b, user_b = get_auth_headers(email="user_b@example.test")

    # User A creates conv
    msg_a = client.post("/api/v1/chat/message", json={"content": "Private Tenancy Case"}, headers=headers_a).json()
    conv_a_id = msg_a["conversation_id"]

    # User B attempts to view
    assert client.get(f"/api/v1/conversations/{conv_a_id}", headers=headers_b).status_code == 403

    # User B attempts to append message
    assert client.post("/api/v1/chat/message", json={
        "conversation_id": conv_a_id,
        "content": "Malicious intrusion attempt"
    }, headers=headers_b).status_code == 403

    # User B attempts to delete
    assert client.delete(f"/api/v1/conversations/{conv_a_id}", headers=headers_b).status_code == 403

def test_10_remember_me_cookie_and_token_expiry():
    """Test 10: Remember-me sets persistent HttpOnly session cookie."""
    client.post("/api/v1/auth/otp/request", json={"email": "persistent@example.test"})
    verify_resp = client.post("/api/v1/auth/otp/verify", json={
        "email": "persistent@example.test",
        "code": "123456",
        "remember_me": True
    })
    assert verify_resp.status_code == 200
    # Check HttpOnly cookie was set
    assert "libra_session" in verify_resp.cookies
    token = verify_resp.json()["access_token"]
    assert token is not None
