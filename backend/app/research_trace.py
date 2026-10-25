"""
VIDHIVRAKSH Research Trace

Builds a compact, user-facing record of the operations the assistant actually performed for a
message: receiving the question, safety screening, the clarity check, the keyword search of the
local corpus, the records selected, and how the answer was prepared.

Every step is derived from real results returned by the safety engine and the retrieval engine.
Stages that did not run are omitted rather than simulated. Only display-safe metadata is included
(no message text, no internal reasons, no file paths or credentials).
"""

from typing import Any, Dict, List, Optional

from app.safety import (
    CAT_AMBIGUOUS,
    CAT_CRISIS_SUPPORT,
    CAT_HARMFUL,
    CAT_VICTIM_SUPPORT,
)

TRACE_VERSION = 1


def _step(step_id: str, outcome: str, status: str = "completed", details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {"id": step_id, "status": status, "outcome": outcome, "details": details or {}}


def _safety_outcome(category: str) -> str:
    if category == CAT_AMBIGUOUS:
        return "clarification_requested"
    if category == CAT_HARMFUL:
        return "refused"
    if category == CAT_CRISIS_SUPPORT:
        return "support_offered"
    if category == CAT_VICTIM_SUPPORT:
        return "allowed_victim_support"
    return "allowed"


def build_trace(
    safety_category: str,
    lang: str,
    mode: str,
    response_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Returns the research trace for one assistant reply."""
    steps: List[Dict[str, Any]] = [
        _step("question_received", "received", details={"language": lang, "mode": mode}),
        _step("safety_screening", _safety_outcome(safety_category)),
    ]

    # The safety engine answered on its own: no retrieval was performed.
    if response_data is None:
        return {"version": TRACE_VERSION, "steps": steps}

    meta = response_data.get("trace_meta") or {}
    clarity = meta.get("clarity", "clear")
    steps.append(_step("clarity_check", clarity))
    if clarity == "needs_context":
        steps.append(_step("answer_preparation", "context_request"))
        return {"version": TRACE_VERSION, "steps": steps}

    search = meta.get("search") or {}
    sources = response_data.get("sources") or []
    matched_terms = search.get("matched_terms") or {}

    steps.append(_step(
        "corpus_search",
        "matches_found" if sources else "no_matches",
        details={
            "method": search.get("method", "keyword_match"),
            "records_searched": search.get("records_searched"),
            "records_matched": search.get("records_matched", len(sources)),
            "duration_ms": search.get("duration_ms"),
        },
    ))

    if sources:
        steps.append(_step(
            "records_review",
            "records_selected",
            details={
                "records": [
                    {
                        "id": src.get("id"),
                        "title": src.get("title"),
                        "year": src.get("year"),
                        "court": src.get("court") if src.get("is_landmark_case") else src.get("court_or_authority"),
                        "citation": src.get("citation") or None,
                        "kind": "landmark_case" if src.get("is_landmark_case") else "statutory_summary",
                        "topic": src.get("topic"),
                        "matched_terms": matched_terms.get(src.get("id"), []),
                    }
                    for src in sources
                ],
            },
        ))

    basis = meta.get("answer_basis", "top_record_template")
    answer_details: Dict[str, Any] = {"mode": mode}
    if basis == "top_record_template":
        answer_record = next((s for s in sources if s.get("id") == meta.get("answer_record_id")), None)
        if answer_record:
            answer_details["record_title"] = answer_record.get("title")
    steps.append(_step(
        "answer_preparation",
        "grounded_answer" if basis == "top_record_template" else "limited_answer",
        details=answer_details,
    ))
    return {"version": TRACE_VERSION, "steps": steps}
