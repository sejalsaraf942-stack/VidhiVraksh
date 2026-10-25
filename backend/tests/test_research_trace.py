import uuid

from fastapi.testclient import TestClient

from app.main import app
from app.corpus import DEMO_CORPUS
import app.routes as routes

client = TestClient(app)


def create_user():
    email = f"trace_{uuid.uuid4().hex[:8]}@example.test"
    password = "StrongPassword123!"
    r = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": password,
        "confirm_password": password,
        "name": "Trace Test User",
        "role": "citizen",
    })
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def send(headers, content, conv_id=None):
    body = {"content": content, "mode": "normal", "language": "en"}
    if conv_id:
        body["conversation_id"] = conv_id
    return client.post("/api/v1/chat/message", json=body, headers=headers)


def step_ids(trace):
    return [s["id"] for s in trace["steps"]]


def test_answer_trace_reflects_real_retrieval():
    headers = create_user()
    data = send(headers, "Can my landlord deduct my security deposit without receipts?").json()
    trace = data["assistant_message"]["trace"]

    assert step_ids(trace) == [
        "question_received", "safety_screening", "clarity_check",
        "corpus_search", "records_review", "answer_preparation",
    ]
    assert all(s["status"] == "completed" for s in trace["steps"])

    search = trace["steps"][3]["details"]
    assert search["method"] == "keyword_match"
    assert search["records_searched"] == len(DEMO_CORPUS)
    assert search["records_matched"] >= 1

    reviewed = trace["steps"][4]["details"]["records"]
    sources = data["assistant_message"]["sources"]
    assert [r["id"] for r in reviewed] == [s["id"] for s in sources]
    assert reviewed[0]["matched_terms"], "matched terms should explain why the record was selected"

    answer = trace["steps"][5]
    assert answer["outcome"] == "grounded_answer"
    assert answer["details"]["record_title"] == sources[0]["title"]


def test_no_match_trace_does_not_invent_records():
    headers = create_user()
    data = send(headers, "What are the legal requirements for building a research station on Mars?").json()
    trace = data["assistant_message"]["trace"]

    assert "records_review" not in step_ids(trace)
    search = next(s for s in trace["steps"] if s["id"] == "corpus_search")
    assert search["outcome"] == "no_matches"
    assert search["details"]["records_matched"] == 0
    assert trace["steps"][-1]["outcome"] == "limited_answer"


def test_safety_clarification_trace_has_no_retrieval():
    headers = create_user()
    data = send(headers, "How to plan a murder?").json()
    trace = data["assistant_message"]["trace"]
    assert step_ids(trace) == ["question_received", "safety_screening"]
    assert trace["steps"][1]["outcome"] == "clarification_requested"


def test_ambiguous_question_trace_stops_at_clarity_check():
    headers = create_user()
    data = send(headers, "Can I do it?").json()
    trace = data["assistant_message"]["trace"]
    assert "corpus_search" not in step_ids(trace)
    assert next(s for s in trace["steps"] if s["id"] == "clarity_check")["outcome"] == "needs_context"


def test_trace_and_type_persist_in_history_in_order():
    headers = create_user()
    first = send(headers, "What is a Zero FIR under BNSS?").json()
    conv_id = first["conversation_id"]
    send(headers, "What are the rules for attestation of a will?", conv_id)

    conv = client.get(f"/api/v1/conversations/{conv_id}", headers=headers).json()
    roles = [m["role"] for m in conv["messages"]]
    assert roles == ["user", "assistant", "user", "assistant"]
    assistant = [m for m in conv["messages"] if m["role"] == "assistant"]
    assert all(m["trace"]["steps"] for m in assistant)
    assert assistant[0]["type"] == first["assistant_message"]["type"]
    assert "trace_json" not in assistant[0]


def test_retrieval_failure_returns_friendly_error_and_leaves_no_orphan(monkeypatch):
    headers = create_user()

    def boom(**_kwargs):
        raise RuntimeError("internal index unavailable at /secret/path")

    monkeypatch.setattr(routes, "generate_legal_response", boom)
    r = send(headers, "What is a Zero FIR?")
    assert r.status_code == 503
    assert "secret" not in r.json()["detail"]
    assert client.get("/api/v1/conversations", headers=headers).json() == []


def test_other_users_cannot_read_trace():
    owner = create_user()
    intruder = create_user()
    conv_id = send(owner, "What is a Zero FIR?").json()["conversation_id"]
    assert client.get(f"/api/v1/conversations/{conv_id}", headers=intruder).status_code == 403
