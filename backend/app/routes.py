import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response

from app.db import get_connection, hash_password, verify_password
from app.config import settings
from app.auth import (
    SignUpRequest,
    LoginRequest,
    OTPRequest,
    OTPVerify,
    ProfileUpdate,
    UserResponse,
    TokenResponse,
    ConversationCreate,
    ConversationUpdate,
    ChatMessageRequest,
    MessageCreate,
    DocumentCreate,
    get_current_user,
    create_access_token,
    PRIVILEGED_ROLES,
    VALID_ROLES,
    VALID_MODES,
    VALID_LANGUAGES,
    get_current_lawyer,
    ConsistencyCheckRequest,
    LandResearchCreate,
    LandResearchUpdate,
    CaseCreate,
    CaseUpdate,
    TimelineEventCreate,
    EvidenceDocumentCreate,
    CaseNoteCreate,
    CaseTaskCreate,
    CaseTaskUpdate,
    ReviewRequestCreate,
    CheckoutRequest,
)
from app.retrieval import generate_legal_response
from app.consistency import check_document_consistency
from app.safety import (
    evaluate_message_safety,
    CAT_LEGITIMATE,
    CAT_VICTIM_SUPPORT,
    CAT_AMBIGUOUS,
    CAT_HARMFUL,
    CAT_CRISIS_SUPPORT,
    CRISIS_SUPPORT_MESSAGES,
)
from app.research_trace import build_trace
from app.phase6_data import SIMULATED_LAND_RECORDS, PROPERTY_VERIFICATION_CHECKLIST

router = APIRouter(prefix="/api/v1")
logger = logging.getLogger(__name__)

# --- 1. Authentication Endpoints ---

@router.post("/auth/signup", response_model=TokenResponse)
def sign_up_user(req: SignUpRequest, response: Response):
    """
    Direct Email/Password sign-up without verification codes.
    Validates email format, password requirements, confirm password,
    enforces email uniqueness with exact error 'USER ALREADY EXISTS',
    hashes password, and establishes a secure session.
    """
    email = req.email.strip().lower()
    if not email or "@" not in email or len(email) < 5 or "." not in email.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format."
        )

    # Validate password
    if not req.password or len(req.password.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password cannot be empty."
        )
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Confirm password match if provided
    if req.confirm_password is not None and req.confirm_password != req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirm password do not match."
        )

    conn = get_connection()
    cursor = conn.cursor()

    # Part C Requirement: Exact duplicate registration check
    cursor.execute("SELECT id FROM users WHERE lower(email) = ?", (email,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="USER ALREADY EXISTS"
        )

    # Check privilege escalation defense
    requested_role = (req.role or "citizen").strip().lower()
    if requested_role in PRIVILEGED_ROLES:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Self-assignment of privileged role '{requested_role}' is strictly prohibited."
        )

    user_role = requested_role if requested_role in VALID_ROLES else "citizen"
    user_lang = req.language if req.language in VALID_LANGUAGES else "en"
    user_mode = "normal"
    now_iso = datetime.now(timezone.utc).isoformat()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_name = req.name.strip() if req.name and req.name.strip() else email.split("@")[0].capitalize()

    # Securely hash password
    pw_hash = hash_password(req.password)

    cursor.execute("""
    INSERT INTO users (id, name, email, password_hash, phone, role, language, mode, subscription, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'free', 'active', ?, ?)
    """, (user_id, user_name, email, pw_hash, user_role, user_lang, user_mode, now_iso, now_iso))

    cursor.execute("""
    INSERT INTO subscriptions (id, user_id, plan, queries_today, query_limit, last_reset_date)
    VALUES (?, ?, 'free', 0, 15, ?)
    """, (f"sub_{uuid.uuid4().hex[:10]}", user_id, now_iso[:10]))

    conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_dict = dict(cursor.fetchone())
    conn.close()

    # Session lifetime based on Remember-me setting
    token_delta = timedelta(days=30) if req.remember_me else timedelta(days=1)
    access_token = create_access_token({
        "sub": user_dict["id"],
        "email": user_dict["email"],
        "role": user_dict["role"],
    }, expires_delta=token_delta)

    # Set secure HttpOnly cookie
    response.set_cookie(
        key="vidhivraksh_session",
        value=access_token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        max_age=int(token_delta.total_seconds()),
    )
    response.set_cookie(
        key="libra_session",
        value=access_token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        max_age=int(token_delta.total_seconds()),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_dict),
    )

@router.post("/auth/login", response_model=TokenResponse)
def login_user(req: LoginRequest, response: Response):
    """
    Direct Email/Password login without verification codes.
    Verifies credentials against stored hash, establishes secure session.
    """
    email = req.email.strip().lower()
    password = req.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE lower(email) = ?", (email,))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_dict = dict(user_row)
    stored_hash = user_dict.get("password_hash")

    if not stored_hash or not verify_password(password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if user_dict.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended due to repeated safety policy violations."
        )

    token_delta = timedelta(days=30) if req.remember_me else timedelta(days=1)
    access_token = create_access_token({
        "sub": user_dict["id"],
        "email": user_dict["email"],
        "role": user_dict["role"],
    }, expires_delta=token_delta)

    response.set_cookie(
        key="vidhivraksh_session",
        value=access_token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        max_age=int(token_delta.total_seconds()),
    )
    response.set_cookie(
        key="libra_session",
        value=access_token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        max_age=int(token_delta.total_seconds()),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_dict),
    )

@router.post("/auth/otp/request")
def request_mock_otp(req: OTPRequest):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address format.")

    mock_code = "123456"
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=15)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO otp_codes (email, code, expires_at, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
        code = excluded.code,
        expires_at = excluded.expires_at,
        created_at = excluded.created_at;
    """, (email, mock_code, expires.isoformat(), now.isoformat()))
    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "message": "Mock OTP generated for development",
        "mock_otp": mock_code,
        "email": email,
        "expires_in_minutes": 15,
    }

@router.post("/auth/otp/verify", response_model=TokenResponse)
def verify_mock_otp(req: OTPVerify, response: Response):
    email = req.email.strip().lower()
    code = req.code.strip()

    conn = get_connection()
    cursor = conn.cursor()

    # Check OTP
    cursor.execute("SELECT * FROM otp_codes WHERE email = ?", (email,))
    otp_record = cursor.fetchone()

    if not otp_record or otp_record["code"] != code:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code entered. Please check and try again.",
        )

    # Check expiration
    expires_at = datetime.fromisoformat(otp_record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new code.",
        )

    # Check if user exists
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    existing_user = cursor.fetchone()
    now_iso = datetime.now(timezone.utc).isoformat()

    if existing_user:
        user_dict = dict(existing_user)
    else:
        # Check rule: Users cannot assign themselves admin or lawyer privileges
        requested_role = (req.role or "citizen").strip().lower()
        if requested_role in PRIVILEGED_ROLES:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Self-assignment of privileged role '{requested_role}' is strictly prohibited.",
            )

        user_role = requested_role if requested_role in VALID_ROLES else "citizen"
        user_lang = req.language if req.language in VALID_LANGUAGES else "en"
        # Rule: New users default to Normal mode
        user_mode = "normal"
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_name = req.name.strip() if req.name and req.name.strip() else email.split("@")[0].capitalize()

        cursor.execute("""
        INSERT INTO users (id, name, email, phone, role, language, mode, subscription, status, created_at, updated_at)
        VALUES (?, ?, ?, NULL, ?, ?, ?, 'free', 'active', ?, ?)
        """, (user_id, user_name, email, user_role, user_lang, user_mode, now_iso, now_iso))

        cursor.execute("""
        INSERT INTO subscriptions (id, user_id, plan, queries_today, query_limit, last_reset_date)
        VALUES (?, ?, 'free', 0, 15, ?)
        """, (f"sub_{uuid.uuid4().hex[:10]}", user_id, now_iso[:10]))

        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user_dict = dict(cursor.fetchone())

    # Delete used OTP
    cursor.execute("DELETE FROM otp_codes WHERE email = ?", (email,))
    conn.commit()
    conn.close()

    # Session Lifetime based on Remember-me setting
    # If remember_me is True: 30 days. If False: 1 day.
    token_delta = timedelta(days=30) if req.remember_me else timedelta(days=1)

    access_token = create_access_token({
        "sub": user_dict["id"],
        "email": user_dict["email"],
        "role": user_dict["role"],
    }, expires_delta=token_delta)

    # Set secure HttpOnly cookie for session persistence without localstorage passwords
    response.set_cookie(
        key="libra_session",
        value=access_token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        max_age=int(token_delta.total_seconds()),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_dict),
    )

@router.get("/auth/me", response_model=UserResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@router.patch("/auth/profile", response_model=UserResponse)
def update_user_profile(
    updates: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    name = updates.name.strip() if updates.name and updates.name.strip() else current_user["name"]
    lang = updates.language if updates.language in VALID_LANGUAGES else current_user["language"]
    mode = updates.mode if updates.mode in VALID_MODES else current_user["mode"]

    # Phase 8: Server-side entitlement check for Professional Mode
    if updates.mode == "professional":
        is_entitled = bool(
            current_user.get("is_pro_entitled") or
            current_user.get("subscription") == "professional" or
            current_user.get("role") in ["lawyer", "admin"]
        )
        if not is_entitled:
            cursor.execute("SELECT id FROM demo_entitlements WHERE user_id = ? AND status = 'active'", (current_user["id"],))
            if cursor.fetchone():
                is_entitled = True

        if not is_entitled:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Professional Mode requires an active plan entitlement. Please visit the pricing page to subscribe."
            )

    cursor.execute("""
    UPDATE users
    SET name = ?, language = ?, mode = ?, updated_at = ?
    WHERE id = ?
    """, (name, lang, mode, now_iso, current_user["id"]))
    conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (current_user["id"],))
    updated_user = dict(cursor.fetchone())
    conn.close()

    return UserResponse(**updated_user)

# --- Phase 8: Billing, Plans & Simulated Checkout ---

DEMO_PLANS = [
    {
        "id": "pro_legal",
        "name": "Pro Legal",
        "badge": "Popular",
        "description": "Comprehensive legal research, full statutory analysis, and structured legal memorandums for citizens and small businesses.",
        "monthly_price_inr": 499,
        "yearly_price_inr": 4999,
        "features": [
            "Professional Mode legal memorandums",
            "All 30 landmark Supreme Court precedents",
            "Unlimited legal awareness consultations",
            "Direct clause consistency validation",
            "Bilingual citations & ratio decidendi analysis"
        ]
    },
    {
        "id": "advocate_suite",
        "name": "Advocate Suite",
        "badge": "For Practitioners",
        "description": "Full practice management workspace with timeline tracking, evidence vault, case task scheduling, and complete precedent discovery.",
        "monthly_price_inr": 1499,
        "yearly_price_inr": 14990,
        "features": [
            "Everything in Pro Legal plan",
            "Lawyer Case Management & client matter files",
            "Procedural timeline event tracking",
            "Evidence review and cataloging vault",
            "Client tasks, priority flags & limitation alarms",
            "Multi-device persistent sync"
        ]
    }
]
PLAN_MAP = {p["id"]: p for p in DEMO_PLANS}

@router.get("/billing/plans")
def list_billing_plans():
    """Returns available demonstration plans and pricing tiers."""
    return {
        "plans": DEMO_PLANS,
        "disclaimer": "Prototype Notice: All amounts are demonstration figures in INR. No real monetary transactions occur.",
        "currency": "INR",
    }

@router.get("/billing/entitlement")
def get_user_entitlement(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's current Professional Mode entitlement status."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM demo_entitlements
    WHERE user_id = ? AND status = 'active'
    ORDER BY created_at DESC LIMIT 1
    """, (current_user["id"],))
    ent = cursor.fetchone()
    conn.close()

    is_entitled = bool(
        current_user.get("is_pro_entitled") or
        current_user.get("subscription") == "professional" or
        current_user.get("role") in ["lawyer", "admin"] or
        ent
    )

    return {
        "is_entitled": is_entitled,
        "plan": current_user.get("subscription", "free"),
        "mode": current_user.get("mode", "normal"),
        "is_simulated": True,
        "entitlement": dict(ent) if ent else None,
    }

@router.post("/billing/checkout")
def process_simulated_checkout(
    req: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Processes simulated checkout for Professional Mode access."""
    plan_id = req.plan_id.strip().lower()
    interval = req.billing_interval.strip().lower()

    if plan_id not in PLAN_MAP:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid plan identifier: {plan_id}")
    if interval not in ["monthly", "yearly"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Billing interval must be 'monthly' or 'yearly'")

    plan = PLAN_MAP[plan_id]
    amount_inr = plan["yearly_price_inr"] if interval == "yearly" else plan["monthly_price_inr"]
    ent_id = f"ent_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()

    # Record simulated entitlement
    cursor.execute("""
    INSERT INTO demo_entitlements (id, user_id, plan_id, plan_name, billing_interval, amount_inr, is_simulated, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'active', ?)
    """, (ent_id, current_user["id"], plan_id, plan["name"], interval, amount_inr, now_iso))

    # Activate Professional Mode and entitlement on user
    cursor.execute("""
    UPDATE users
    SET is_pro_entitled = 1, subscription = 'professional', mode = 'professional', updated_at = ?
    WHERE id = ?
    """, (now_iso, current_user["id"]))

    cursor.execute("""
    UPDATE subscriptions
    SET plan = 'professional', query_limit = 500
    WHERE user_id = ?
    """, (current_user["id"],))

    conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (current_user["id"],))
    updated_user = dict(cursor.fetchone())
    conn.close()

    return {
        "success": True,
        "message": "Simulated purchase successful. Professional Mode is now activated.",
        "entitlement": {
            "id": ent_id,
            "plan_id": plan_id,
            "plan_name": plan["name"],
            "billing_interval": interval,
            "amount_inr": amount_inr,
            "is_simulated": True,
            "status": "active",
            "created_at": now_iso,
        },
        "user": UserResponse(**updated_user),
    }

@router.post("/auth/signout")
def sign_out(response: Response, current_user: dict = Depends(get_current_user)):
    response.delete_cookie(key="vidhivraksh_session")
    response.delete_cookie(key="libra_session")
    return {
        "status": "ok",
        "message": "Successfully signed out. Session invalidated.",
        "user_id": current_user["id"],
    }

# --- 2. Protected Conversations & Messages ---

@router.get("/conversations")
def list_conversations(current_user: dict = Depends(get_current_user)):
    """Returns only conversations owned by the authenticated user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM conversations
    WHERE user_id = ?
    ORDER BY updated_at DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/conversations")
def create_conversation(
    conv: ConversationCreate,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    conv_id = f"conv_{uuid.uuid4().hex[:12]}"

    cursor.execute("""
    INSERT INTO conversations (id, user_id, title, language, mode, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        conv_id,
        current_user["id"],
        conv.title,
        conv.language if conv.language in VALID_LANGUAGES else current_user["language"],
        conv.mode if conv.mode in VALID_MODES else current_user["mode"],
        now_iso,
        now_iso
    ))
    conn.commit()

    cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
    record = dict(cursor.fetchone())
    conn.close()
    return record

@router.get("/conversations/{conv_id}")
def get_conversation_details(
    conv_id: str,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv = dict(row)
    # Secure ownership check
    if conv["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not own this conversation.",
        )

    # Fetch messages in chronological order
    cursor.execute("""
    SELECT * FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC, rowid ASC
    """, (conv_id,))
    messages = []
    for m in cursor.fetchall():
        m_dict = dict(m)
        if m_dict.get("sources_json"):
            try:
                m_dict["sources"] = json.loads(m_dict["sources_json"])
            except Exception:
                m_dict["sources"] = []
        else:
            m_dict["sources"] = []
        trace_raw = m_dict.pop("trace_json", None)
        try:
            m_dict["trace"] = json.loads(trace_raw) if trace_raw else None
        except Exception:
            m_dict["trace"] = None
        m_dict["type"] = m_dict.pop("message_type", None)
        messages.append(m_dict)
    conn.close()

    conv["messages"] = messages
    return conv

@router.patch("/conversations/{conv_id}")
def rename_conversation(
    conv_id: str,
    update: ConversationUpdate,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
    conv = cursor.fetchone()
    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not own this conversation.",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    new_title = update.title.strip() if update.title and update.title.strip() else conv["title"]
    new_lang = update.language if update.language in VALID_LANGUAGES else conv["language"]
    new_mode = update.mode if update.mode in VALID_MODES else conv["mode"]

    cursor.execute("""
    UPDATE conversations
    SET title = ?, language = ?, mode = ?, updated_at = ?
    WHERE id = ?
    """, (new_title, new_lang, new_mode, now_iso, conv_id))
    conn.commit()

    cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return updated

@router.delete("/conversations/{conv_id}")
def delete_conversation(
    conv_id: str,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
    conv = cursor.fetchone()
    if not conv:
        conn.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not own this conversation.",
        )

    cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
    cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "message": "Conversation successfully deleted",
        "id": conv_id,
    }

# --- 3. Chat Workspace: Deterministic Legal Assistant & Intelligent Safety ---

@router.post("/chat/message")
def send_chat_message(
    req: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    # Enforce suspended account status
    if current_user.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended due to repeated safety policy violations."
        )

    content = req.content.strip() if req.content else ""
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    conv_id = req.conversation_id
    is_new_conversation = not conv_id
    if conv_id:
        cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
        conv_row = cursor.fetchone()
        if not conv_row:
            conn.close()
            raise HTTPException(status_code=404, detail="Conversation not found")
        if conv_row["user_id"] != current_user["id"]:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You do not own this conversation.",
            )
        conv = dict(conv_row)

        # Enforce conversation termination
        if conv.get("is_terminated"):
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This conversation was terminated due to a safety policy violation and cannot accept further messages."
            )

        lang = req.language or conv.get("language") or current_user.get("language", "en")
        mode = req.mode or conv.get("mode") or current_user.get("mode", "normal")
    else:
        # Create a new conversation automatically
        conv_id = f"conv_{uuid.uuid4().hex[:12]}"
        lang = req.language if req.language in VALID_LANGUAGES else current_user.get("language", "en")
        mode = req.mode if req.mode in VALID_MODES else current_user.get("mode", "normal")
        title = content[:45] + ("..." if len(content) > 45 else "")

        cursor.execute("""
        INSERT INTO conversations (id, user_id, title, language, mode, is_terminated, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?)
        """, (conv_id, current_user["id"], title, lang, mode, now_iso, now_iso))
        conn.commit()

    # Fetch recent messages in conversation for context
    cursor.execute("SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", (conv_id,))
    recent_messages = [dict(r) for r in cursor.fetchall()]

    # Run Intelligent Safety Classification
    safety_eval = evaluate_message_safety(text=content, recent_messages=recent_messages, lang=lang)

    # 1. Save user message
    user_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    cursor.execute("""
    INSERT INTO messages (id, conversation_id, role, content, sources_json, created_at)
    VALUES (?, ?, 'user', ?, NULL, ?)
    """, (user_msg_id, conv_id, content, now_iso))

    # CASE A: Ambiguous Request -> Return Neutral Clarification Question (No Warning)
    # Self-harm signals reuse this path with support resources instead of a question (No Warning).
    if safety_eval.category in (CAT_AMBIGUOUS, CAT_CRISIS_SUPPORT):
        is_crisis = safety_eval.category == CAT_CRISIS_SUPPORT
        asst_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        if is_crisis:
            clarif_content = CRISIS_SUPPORT_MESSAGES.get(lang, CRISIS_SUPPORT_MESSAGES["en"])
        else:
            clarif_content = safety_eval.clarification_text or "Could you please clarify the specific lawful purpose of your request?"
        reply_type = "crisis_support" if is_crisis else "clarification_needed"
        trace = build_trace(safety_eval.category, lang, mode)
        cursor.execute("""
        INSERT INTO messages (id, conversation_id, role, content, sources_json, trace_json, message_type, created_at)
        VALUES (?, ?, 'assistant', ?, NULL, ?, ?, ?)
        """, (asst_msg_id, conv_id, clarif_content, json.dumps(trace), reply_type, now_iso))

        cursor.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now_iso, conv_id))
        conn.commit()
        conn.close()

        return {
            "conversation_id": conv_id,
            "user_message": {
                "id": user_msg_id,
                "conversation_id": conv_id,
                "role": "user",
                "content": content,
                "created_at": now_iso,
            },
            "assistant_message": {
                "id": asst_msg_id,
                "conversation_id": conv_id,
                "role": "assistant",
                "content": clarif_content,
                "sources": [],
                "created_at": now_iso,
                "mode": mode,
                "language": lang,
                "type": reply_type,
                "trace": trace,
                "disclaimer": (
                    "Support resources: you are not alone." if is_crisis
                    else "Safety Clarification: Establishing lawful purpose before proceeding."
                ),
                "follow_up_suggestions": [],
                "insufficient_info": False,
            },
            "safety": safety_eval.to_dict(),
            "warning": None,
            "is_terminated": False,
        }

    # CASE B: Harmful Request -> Refuse + Record Warning + Terminate Chat (+ Suspend if 3rd)
    if safety_eval.category == CAT_HARMFUL:
        # Atomic warning calculation
        cursor.execute("SELECT warning_count FROM users WHERE id = ?", (current_user["id"],))
        res = cursor.fetchone()
        curr_warnings = res[0] if (res and res[0] is not None) else 0
        new_warnings = curr_warnings + 1

        warn_id = f"warn_{uuid.uuid4().hex[:12]}"
        cursor.execute("""
        INSERT INTO account_warnings (
            id, user_id, conversation_id, message_id, rule_id,
            policy_category, warning_number, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            warn_id, current_user["id"], conv_id, user_msg_id, safety_eval.rule_id,
            "harmful_assistance", new_warnings, safety_eval.reason, now_iso
        ))

        # Update user warning count
        is_suspended = (new_warnings >= 3)
        if is_suspended:
            cursor.execute("""
            UPDATE users SET warning_count = ?, status = 'suspended', updated_at = ? WHERE id = ?
            """, (new_warnings, now_iso, current_user["id"]))
        else:
            cursor.execute("""
            UPDATE users SET warning_count = ?, updated_at = ? WHERE id = ?
            """, (new_warnings, now_iso, current_user["id"]))

        # Terminate current conversation
        cursor.execute("""
        UPDATE conversations SET is_terminated = 1, termination_reason = ?, updated_at = ? WHERE id = ?
        """, (safety_eval.reason, now_iso, conv_id))

        # Store refusal assistant message
        asst_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        refusal_content = (
            f"⚠️ SAFETY REFUSAL\n\n"
            f"{safety_eval.refusal_text}\n\n"
            f"{safety_eval.lawful_alternative}\n\n"
            f"[Chat Terminated: Warning {new_warnings} of 3 recorded for this account.]"
        )

        trace = build_trace(safety_eval.category, lang, mode)
        cursor.execute("""
        INSERT INTO messages (id, conversation_id, role, content, sources_json, trace_json, message_type, created_at)
        VALUES (?, ?, 'assistant', ?, NULL, ?, 'safety_refusal', ?)
        """, (asst_msg_id, conv_id, refusal_content, json.dumps(trace), now_iso))

        conn.commit()
        conn.close()

        return {
            "conversation_id": conv_id,
            "user_message": {
                "id": user_msg_id,
                "conversation_id": conv_id,
                "role": "user",
                "content": content,
                "created_at": now_iso,
            },
            "assistant_message": {
                "id": asst_msg_id,
                "conversation_id": conv_id,
                "role": "assistant",
                "content": refusal_content,
                "sources": [],
                "created_at": now_iso,
                "mode": mode,
                "language": lang,
                "type": "safety_refusal",
                "trace": trace,
                "disclaimer": "Enforcement Notice: Prohibited request refused under safety policy.",
                "follow_up_suggestions": [],
                "insufficient_info": False,
            },
            "safety": safety_eval.to_dict(),
            "warning": {
                "warning_id": warn_id,
                "warning_number": new_warnings,
                "max_warnings": 3,
                "rule_id": safety_eval.rule_id,
                "reason": safety_eval.reason,
                "is_suspended": is_suspended,
            },
            "is_terminated": True,
        }

    # CASE C: Legitimate or Victim Support Inquiry -> Proceed Normally
    try:
        response_data = generate_legal_response(query=content, lang=lang, mode=mode)
    except Exception:
        # Nothing is committed for this turn; log without the user's message text.
        logger.exception("Legal retrieval failed for conversation %s", conv_id)
        conn.rollback()
        if is_new_conversation:
            cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
            conn.commit()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The legal database could not be searched right now. Please try again.",
        )

    asst_msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    sources_serialized = json.dumps(response_data.get("sources", [])) if response_data.get("sources") else None
    trace = build_trace(safety_eval.category, lang, mode, response_data)
    reply_type = response_data.get("type", "answer")

    cursor.execute("""
    INSERT INTO messages (id, conversation_id, role, content, sources_json, trace_json, message_type, created_at)
    VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?)
    """, (asst_msg_id, conv_id, response_data["content"], sources_serialized, json.dumps(trace), reply_type, now_iso))

    cursor.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now_iso, conv_id))
    conn.commit()
    conn.close()

    return {
        "conversation_id": conv_id,
        "user_message": {
            "id": user_msg_id,
            "conversation_id": conv_id,
            "role": "user",
            "content": content,
            "created_at": now_iso,
        },
        "assistant_message": {
            "id": asst_msg_id,
            "conversation_id": conv_id,
            "role": "assistant",
            "content": response_data["content"],
            "sources": response_data.get("sources", []),
            "created_at": now_iso,
            "mode": mode,
            "language": lang,
            "type": reply_type,
            "trace": trace,
            "disclaimer": response_data.get("disclaimer"),
            "follow_up_suggestions": response_data.get("follow_up_suggestions", []),
            "insufficient_info": response_data.get("insufficient_info", False),
        },
        "safety": safety_eval.to_dict(),
        "warning": None,
        "is_terminated": False,
    }

@router.post("/safety/review-request")
def submit_safety_warning_review(
    req: ReviewRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submits a dispute/review request for an account safety warning."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM account_warnings WHERE id = ? AND user_id = ?", (req.warning_id, current_user["id"]))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Warning record not found.")

    rev_id = f"rev_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO warning_reviews (id, user_id, warning_id, reason, status, created_at)
    VALUES (?, ?, ?, ?, 'pending_review', ?)
    """, (rev_id, current_user["id"], req.warning_id, req.reason.strip(), now_iso))
    conn.commit()
    conn.close()
    return {
        "success": True,
        "status": "pending_review",
        "review_id": rev_id,
        "message": "Warning review request submitted for audit."
    }

@router.get("/safety/status")
def get_safety_status(current_user: dict = Depends(get_current_user)):
    """Returns current account safety warning count and status."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT warning_count, status FROM users WHERE id = ?", (current_user["id"],))
    row = cursor.fetchone()
    warning_count = row[0] if (row and row[0] is not None) else 0
    status_val = row[1] if row else "active"

    cursor.execute("SELECT * FROM account_warnings WHERE user_id = ? ORDER BY created_at DESC", (current_user["id"],))
    warnings = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "warning_count": warning_count,
        "max_warnings": 3,
        "status": status_val,
        "is_suspended": (status_val == "suspended" or warning_count >= 3),
        "warnings": warnings
    }

# --- 4. Protected Documents ---

@router.get("/documents")
def list_user_documents(current_user: dict = Depends(get_current_user)):
    """Returns only documents owned by the authenticated user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM uploaded_documents
    WHERE user_id = ?
    ORDER BY created_at DESC
    """, (current_user["id"],))
    docs = [dict(d) for d in cursor.fetchall()]
    conn.close()
    return docs

@router.post("/documents")
def create_document_record(
    doc: DocumentCreate,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO uploaded_documents (id, user_id, filename, file_type, file_size, content_snippet, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (doc_id, current_user["id"], doc.filename, doc.file_type, doc.file_size, doc.content_snippet, now_iso))
    conn.commit()

    cursor.execute("SELECT * FROM uploaded_documents WHERE id = ?", (doc_id,))
    record = dict(cursor.fetchone())
    conn.close()
    return record

@router.get("/documents/{doc_id}")
def get_document_details(
    doc_id: str,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM uploaded_documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    doc = dict(row)
    if doc["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to view this document.",
        )
    conn.close()
    return doc

# ==========================================
# --- 5. Legal Document Library (Phase 6) ---
# ==========================================

@router.get("/library/documents")
def list_library_documents(
    q: Optional[str] = None,
    search: Optional[str] = None,
    category: Optional[str] = None,
    doc_type: Optional[str] = None,
    language: Optional[str] = None
):
    """
    Searchable Legal Document Library with category and type filters.
    Returns curated statutory document templates and explanations.
    """
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM legal_documents WHERE 1=1"
    params = []

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    if doc_type and doc_type != "all":
        query += " AND doc_type = ?"
        params.append(doc_type)

    if language:
        query += " AND language = ?"
        params.append(language)

    effective_search = q or search
    if effective_search and effective_search.strip():
        term = f"%{effective_search.strip().lower()}%"
        query += " AND (lower(title) LIKE ? OR lower(short_description) LIKE ? OR lower(intended_purpose) LIKE ? OR lower(plain_explanation) LIKE ?)"
        params.extend([term, term, term, term])

    query += " ORDER BY title ASC"
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        d["typical_use_cases"] = json.loads(d["typical_use_cases"]) if d.get("typical_use_cases") else []
        d["important_clauses"] = json.loads(d["important_clauses"]) if d.get("important_clauses") else []
        d["essential_clauses"] = d["important_clauses"]
        d["key_terms"] = json.loads(d["key_terms_json"]) if d.get("key_terms_json") else []
        d["summary"] = d.get("short_description", "")
        d["governing_law"] = [d.get("source_reference", "Indian Law")]
        d["jurisdiction"] = "Pan-India"
        results.append(d)

    return {"documents": results, "total": len(results)}

@router.get("/library/documents/{doc_id}")
def get_library_document(doc_id: str):
    """Returns detailed view of a legal document, including clauses and plain-language explanation."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM legal_documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Document not found in library.")

    d = dict(row)
    d["typical_use_cases"] = json.loads(d["typical_use_cases"]) if d.get("typical_use_cases") else []
    d["important_clauses"] = json.loads(d["important_clauses"]) if d.get("important_clauses") else []
    d["essential_clauses"] = d["important_clauses"]
    d["key_terms"] = json.loads(d["key_terms_json"]) if d.get("key_terms_json") else []
    d["key_risks"] = [
        "State-specific stamp duty and registration requirements must be verified.",
        "Unilateral alterations without mutual consent render clauses voidable.",
        "Consult a licensed advocate to tailor dispute resolution provisions."
    ]
    d["governing_law"] = [d.get("source_reference", "Indian Contract Act, 1872")]
    d["template_text"] = d.get("sample_template", "")
    d["jurisdiction"] = "Pan-India"
    d["disclaimer"] = "SAMPLE TEMPLATE — NOT VERIFIED FOR YOUR SPECIFIC SITUATION"
    return d

@router.post("/library/check-consistency")
def run_consistency_check(req: ConsistencyCheckRequest):
    """
    Deterministic Document Consistency Checker.
    Identifies common drafting discrepancies (unfilled placeholders, mixed terminology, amount conflicts).
    """
    return check_document_consistency(req.text)

# =======================================================
# --- 6. Land Ownership Research Demo (Phase 6) ---
# =======================================================

@router.get("/land-research")
def list_land_research_entries(current_user: dict = Depends(get_current_user)):
    """Returns saved property research entries for the authenticated user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM land_research_entries
    WHERE user_id = ?
    ORDER BY updated_at DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        d["checklist_progress"] = json.loads(d["checklist_progress_json"]) if d.get("checklist_progress_json") else []
        d["images"] = json.loads(d["images_json"]) if d.get("images_json") else []
        d["verification_status"] = d.get("status", "unverified")
        results.append(d)
    return {"entries": results, "total": len(results)}

@router.post("/land-research")
def create_land_research_entry(
    req: LandResearchCreate,
    current_user: dict = Depends(get_current_user)
):
    """Creates a new simulated property research entry."""
    conn = get_connection()
    cursor = conn.cursor()
    entry_id = f"land_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    entry_name = (req.entry_name or f"{req.locality or req.survey_number or 'Property'} ({req.district})").strip()
    locality = (req.locality or "").strip()
    prop_desc = (req.property_description or "").strip()
    status_val = req.verification_status or "unverified"

    cursor.execute("""
    INSERT INTO land_research_entries (
        id, user_id, entry_name, state, district, locality,
        survey_number, property_description, status,
        checklist_progress_json, notes, images_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, '[]', ?, ?)
    """, (
        entry_id, current_user["id"], entry_name, req.state.strip(),
        req.district.strip(), locality,
        req.survey_number.strip() if req.survey_number else None,
        prop_desc, status_val, req.notes or "", now_iso, now_iso
    ))
    conn.commit()

    cursor.execute("SELECT * FROM land_research_entries WHERE id = ?", (entry_id,))
    record = dict(cursor.fetchone())
    conn.close()
    record["checklist_progress"] = []
    record["images"] = []
    record["verification_status"] = record.get("status", "unverified")
    return record
    return record

@router.get("/land-research/simulated-examples")
def get_simulated_land_examples():
    """Returns curated fictional land research examples and educational checklist."""
    enriched_records = []
    for rec in SIMULATED_LAND_RECORDS:
        r = dict(rec)
        r["disclaimer"] = "FICTIONAL DEMONSTRATION DATA — NOT AN OFFICIAL PROPERTY RECORD"
        r["survey_number"] = r.get("survey_identifier", "SIM-RECORD")
        r["owner_name"] = r.get("owner_name", "Simulated Citizen Titleholder")
        r["total_area"] = r.get("total_area", "2,400 sq.ft.")
        r["encumbrance_status"] = r.get("status", "Requires Verification")
        r["chain_of_title"] = [
            f"{c.get('year', '')} — {c.get('event', '')}"
            for c in r.get("hypothetical_chain", [])
        ]
        r["red_flags"] = r.get("missing_documents", [])
        enriched_records.append(r)

    checklist_steps = []
    for idx, step in enumerate(PROPERTY_VERIFICATION_CHECKLIST, start=1):
        s = dict(step)
        s["step"] = idx
        s["title"] = s.get("title", s.get("step_title", f"Step {idx}"))
        s["description"] = s.get("desc", s.get("why_it_matters", ""))
        s["importance"] = s.get("desc", s.get("why_it_matters", ""))
        checklist_steps.append(s)

    return {
        "disclaimer": "DEMO MODE — PROPERTY RECORDS ARE SIMULATED AND OWNERSHIP HAS NOT BEEN VERIFIED.",
        "notice": "DEMO MODE — PROPERTY RECORDS ARE SIMULATED AND OWNERSHIP HAS NOT BEEN VERIFIED.",
        "simulated_records": enriched_records,
        "educational_checklist": checklist_steps,
        "verification_checklist": checklist_steps
    }

@router.get("/land-research/{entry_id}")
def get_land_research_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM land_research_entries WHERE id = ?", (entry_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Land research entry not found.")

    entry = dict(row)
    if entry["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access forbidden: You do not own this entry.")

    entry["checklist_progress"] = json.loads(entry["checklist_progress_json"]) if entry.get("checklist_progress_json") else []
    entry["images"] = json.loads(entry["images_json"]) if entry.get("images_json") else []
    return entry

@router.patch("/land-research/{entry_id}")
def update_land_research_entry(
    entry_id: str,
    req: LandResearchUpdate,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM land_research_entries WHERE id = ?", (entry_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Land research entry not found.")

    entry = dict(row)
    if entry["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access forbidden.")

    now_iso = datetime.now(timezone.utc).isoformat()
    entry_name = req.entry_name.strip() if req.entry_name else entry["entry_name"]
    prop_desc = req.property_description.strip() if req.property_description else entry["property_description"]
    stat = req.status.strip() if req.status else entry["status"]
    notes = req.notes if req.notes is not None else entry["notes"]
    prog_json = json.dumps(req.checklist_progress) if req.checklist_progress is not None else entry["checklist_progress_json"]

    cursor.execute("""
    UPDATE land_research_entries
    SET entry_name = ?, property_description = ?, status = ?, notes = ?, checklist_progress_json = ?, updated_at = ?
    WHERE id = ?
    """, (entry_name, prop_desc, stat, notes, prog_json, now_iso, entry_id))
    conn.commit()

    cursor.execute("SELECT * FROM land_research_entries WHERE id = ?", (entry_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    updated["checklist_progress"] = json.loads(updated["checklist_progress_json"]) if updated.get("checklist_progress_json") else []
    updated["images"] = json.loads(updated["images_json"]) if updated.get("images_json") else []
    return updated

@router.delete("/land-research/{entry_id}")
def delete_land_research_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM land_research_entries WHERE id = ?", (entry_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Entry not found.")

    if dict(row)["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access forbidden.")

    cursor.execute("DELETE FROM land_research_entries WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "success": True, "message": "Research entry deleted successfully."}

# ============================================================
# --- 7. Protected Lawyer Case Management Workspace (Phase 6) ---
# ============================================================

@router.get("/cases/dashboard")
def get_lawyer_cases_dashboard(current_user: dict = Depends(get_current_lawyer)):
    """
    Lawyer Workspace Dashboard Metrics.
    Dynamically calculated from saved cases, tasks, and deadlines.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Total cases & active cases
    cursor.execute("SELECT count(*) FROM lawyer_cases WHERE user_id = ?", (current_user["id"],))
    total_cases = cursor.fetchone()[0]

    cursor.execute("SELECT count(*) FROM lawyer_cases WHERE user_id = ? AND status != 'Archived'", (current_user["id"],))
    active_cases = cursor.fetchone()[0]

    # Pending tasks
    cursor.execute("""
    SELECT count(ct.id) FROM case_tasks ct
    JOIN lawyer_cases lc ON ct.case_id = lc.id
    WHERE lc.user_id = ? AND ct.status != 'Completed'
    """, (current_user["id"],))
    pending_tasks = cursor.fetchone()[0]

    # Upcoming deadlines
    today_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cursor.execute("""
    SELECT count(*) FROM lawyer_cases
    WHERE user_id = ? AND next_deadline IS NOT NULL AND next_deadline >= ?
    """, (current_user["id"], today_iso))
    upcoming_deadlines = cursor.fetchone()[0]

    # Recent updates (latest 5 events)
    cursor.execute("""
    SELECT cte.*, lc.case_title FROM case_timeline_events cte
    JOIN lawyer_cases lc ON cte.case_id = lc.id
    WHERE lc.user_id = ?
    ORDER BY cte.created_at DESC LIMIT 5
    """, (current_user["id"],))
    recent_events = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "lawyer_name": current_user["name"],
        "total_cases": total_cases,
        "active_cases": active_cases,
        "pending_tasks": pending_tasks,
        "upcoming_deadlines": upcoming_deadlines,
        "recent_updates": recent_events,
        "disclaimer": "PROTOTYPE CASE MANAGEMENT — NOT AN OFFICIAL COURT FILING OR REGISTER SYSTEM."
    }

@router.get("/cases")
def list_lawyer_cases(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_lawyer)
):
    """Returns all cases belonging to the authorized lawyer."""
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM lawyer_cases WHERE user_id = ?"
    params = [current_user["id"]]

    if status_filter and status_filter != "all":
        query += " AND status = ?"
        params.append(status_filter)

    query += " ORDER BY updated_at DESC"
    cursor.execute(query, tuple(params))
    raw_cases = [dict(r) for r in cursor.fetchall()]
    conn.close()

    cases = []
    for c in raw_cases:
        c["title"] = c.get("case_title", "")
        c["case_number"] = c.get("internal_ref", "")
        c["court"] = c.get("court_forum", "")
        c["client_name"] = c.get("parties", "")
        c["next_hearing_date"] = c.get("next_deadline")
        cases.append(c)

    return {"cases": cases, "total": len(cases)}

@router.post("/cases")
def create_lawyer_case(
    req: CaseCreate,
    current_user: dict = Depends(get_current_lawyer)
):
    """Creates a new case record for the authorized legal professional."""
    conn = get_connection()
    cursor = conn.cursor()
    case_id = f"case_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    case_title = (req.case_title or req.title or "Untitled Case").strip()
    internal_ref = (req.internal_ref or req.case_number or f"REF-{uuid.uuid4().hex[:6].upper()}").strip()
    court_forum = (req.court_forum or req.court or "District Court").strip()
    parties = (req.parties or req.client_name or (f"{req.client_name} v. {req.opposing_party}" if req.opposing_party else "Client Matter")).strip()
    summary = (req.summary or "").strip()
    status_val = req.status or "active"
    next_deadline = req.next_deadline or req.next_hearing_date

    cursor.execute("""
    INSERT INTO lawyer_cases (
        id, user_id, case_title, internal_ref, case_type, court_forum,
        jurisdiction, parties, summary, status, next_deadline, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        case_id, current_user["id"], case_title, internal_ref,
        (req.case_type or "Civil").strip(), court_forum, req.jurisdiction or "District",
        parties, summary, status_val, next_deadline, now_iso, now_iso
    ))
    conn.commit()

    cursor.execute("SELECT * FROM lawyer_cases WHERE id = ?", (case_id,))
    record = dict(cursor.fetchone())
    conn.close()
    record["title"] = record.get("case_title", "")
    record["case_number"] = record.get("internal_ref", "")
    record["court"] = record.get("court_forum", "")
    record["client_name"] = record.get("parties", "")
    record["next_hearing_date"] = record.get("next_deadline")
    return record

@router.get("/cases/{case_id}")
def get_lawyer_case_details(
    case_id: str,
    current_user: dict = Depends(get_current_lawyer)
):
    """Returns full case details with timeline, evidence, notes, and tasks."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lawyer_cases WHERE id = ?", (case_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found.")

    case_dict = dict(row)
    if case_dict["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access forbidden: You do not own this case.")

    # Fetch sub-resources
    cursor.execute("SELECT * FROM case_timeline_events WHERE case_id = ? ORDER BY event_date DESC", (case_id,))
    raw_timeline = [dict(r) for r in cursor.fetchall()]
    timeline = []
    for ev in raw_timeline:
        ev["title"] = ev.get("title") or ev.get("event_type", "Event")
        timeline.append(ev)

    cursor.execute("SELECT * FROM case_evidence_documents WHERE case_id = ? ORDER BY date_received DESC", (case_id,))
    raw_evidence = [dict(r) for r in cursor.fetchall()]
    evidence = []
    for evd in raw_evidence:
        evd["document_type"] = evd.get("category", "General")
        evidence.append(evd)

    cursor.execute("SELECT * FROM case_notes WHERE case_id = ? ORDER BY created_at DESC", (case_id,))
    raw_notes = [dict(r) for r in cursor.fetchall()]
    notes = []
    for nt in raw_notes:
        nt["title"] = nt.get("category", "Note")
        notes.append(nt)

    cursor.execute("SELECT * FROM case_tasks WHERE case_id = ? ORDER BY due_date ASC", (case_id,))
    raw_tasks = [dict(r) for r in cursor.fetchall()]
    tasks = []
    for tk in raw_tasks:
        tk["is_completed"] = (tk.get("status", "").lower() in ["completed", "done"])
        tasks.append(tk)

    conn.close()

    case_dict["title"] = case_dict.get("case_title", "")
    case_dict["case_number"] = case_dict.get("internal_ref", "")
    case_dict["court"] = case_dict.get("court_forum", "")
    case_dict["client_name"] = case_dict.get("parties", "")
    case_dict["next_hearing_date"] = case_dict.get("next_deadline")
    case_dict["timeline"] = timeline
    case_dict["timeline_events"] = timeline
    case_dict["evidence"] = evidence
    case_dict["evidence_documents"] = evidence
    case_dict["notes"] = notes
    case_dict["tasks"] = tasks
    return case_dict

@router.patch("/cases/{case_id}")
def update_lawyer_case(
    case_id: str,
    req: CaseUpdate,
    current_user: dict = Depends(get_current_lawyer)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lawyer_cases WHERE id = ?", (case_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found.")

    case_dict = dict(row)
    if case_dict["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access forbidden.")

    now_iso = datetime.now(timezone.utc).isoformat()
    case_title = req.case_title.strip() if req.case_title else case_dict["case_title"]
    status_val = req.status.strip() if req.status else case_dict["status"]
    deadline = req.next_deadline if req.next_deadline is not None else case_dict["next_deadline"]
    summary_val = req.summary.strip() if req.summary else case_dict["summary"]
    court_val = req.court_forum if req.court_forum is not None else case_dict["court_forum"]

    cursor.execute("""
    UPDATE lawyer_cases
    SET case_title = ?, status = ?, next_deadline = ?, summary = ?, court_forum = ?, updated_at = ?
    WHERE id = ?
    """, (case_title, status_val, deadline, summary_val, court_val, now_iso, case_id))
    conn.commit()

    cursor.execute("SELECT * FROM lawyer_cases WHERE id = ?", (case_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return updated

@router.delete("/cases/{case_id}")
def delete_lawyer_case(
    case_id: str,
    current_user: dict = Depends(get_current_lawyer)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lawyer_cases WHERE id = ?", (case_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Case not found.")

    if dict(row)["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access forbidden.")

    cursor.execute("DELETE FROM lawyer_cases WHERE id = ?", (case_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "Case and associated records deleted successfully."}

@router.post("/cases/{case_id}/timeline")
def add_case_timeline_event(
    case_id: str,
    req: TimelineEventCreate,
    current_user: dict = Depends(get_current_lawyer)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM lawyer_cases WHERE id = ?", (case_id,))
    row = cursor.fetchone()
    if not row or dict(row)["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access forbidden.")

    ev_id = f"ev_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    ev_type = (req.title or req.event_type or "Procedural Hearing").strip()
    desc = (req.description or req.title or "").strip()

    cursor.execute("""
    INSERT INTO case_timeline_events (id, case_id, event_type, event_date, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (ev_id, case_id, ev_type, req.event_date.strip(), desc, now_iso))
    conn.commit()
    conn.close()
    return {"id": ev_id, "case_id": case_id, "title": ev_type, "event_type": ev_type, "event_date": req.event_date, "description": desc}

@router.post("/cases/{case_id}/evidence")
def add_case_evidence_document(
    case_id: str,
    req: EvidenceDocumentCreate,
    current_user: dict = Depends(get_current_lawyer)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM lawyer_cases WHERE id = ?", (case_id,))
    row = cursor.fetchone()
    if not row or dict(row)["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access forbidden.")

    evd_id = f"evd_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    category_val = (req.category or req.document_type or "General Exhibit").strip()
    date_val = req.date_received or now_iso[:10]

    cursor.execute("""
    INSERT INTO case_evidence_documents (id, case_id, title, category, date_received, source_origin, review_status, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (evd_id, case_id, req.title.strip(), category_val, date_val, req.source_origin or "Client Submission", req.review_status or "Not Reviewed", req.description or req.relevance or "", now_iso))
    conn.commit()
    conn.close()
    return {"id": evd_id, "case_id": case_id, "title": req.title, "category": category_val, "document_type": category_val, "review_status": req.review_status}

@router.post("/cases/{case_id}/notes")
def add_case_note(
    case_id: str,
    req: CaseNoteCreate,
    current_user: dict = Depends(get_current_lawyer)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM lawyer_cases WHERE id = ?", (case_id,))
    row = cursor.fetchone()
    if not row or dict(row)["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access forbidden.")

    note_id = f"note_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    cat_val = (req.title or req.category or "Legal Analysis").strip()

    cursor.execute("""
    INSERT INTO case_notes (id, case_id, category, content, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (note_id, case_id, cat_val, req.content.strip(), now_iso))
    conn.commit()
    conn.close()
    return {"id": note_id, "case_id": case_id, "title": cat_val, "category": cat_val, "content": req.content}

@router.post("/cases/{case_id}/tasks")
def add_case_task(
    case_id: str,
    req: CaseTaskCreate,
    current_user: dict = Depends(get_current_lawyer)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM lawyer_cases WHERE id = ?", (case_id,))
    row = cursor.fetchone()
    if not row or dict(row)["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access forbidden.")

    task_id = f"task_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    stat_val = "Completed" if req.is_completed else (req.status or "Pending")

    cursor.execute("""
    INSERT INTO case_tasks (id, case_id, title, description, due_date, priority, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (task_id, case_id, req.title.strip(), req.description or "", req.due_date, req.priority or "Medium", stat_val, now_iso))
    conn.commit()
    conn.close()
    return {"id": task_id, "case_id": case_id, "title": req.title, "status": stat_val, "is_completed": stat_val.lower() in ["completed", "done"]}

@router.patch("/cases/tasks/{task_id}")
def update_case_task(
    task_id: str,
    req: CaseTaskUpdate,
    current_user: dict = Depends(get_current_lawyer)
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT ct.*, lc.user_id FROM case_tasks ct
    JOIN lawyer_cases lc ON ct.case_id = lc.id
    WHERE ct.id = ?
    """, (task_id,))
    row = cursor.fetchone()
    if not row or dict(row)["user_id"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Access forbidden.")

    task_dict = dict(row)
    if req.is_completed is not None:
        new_stat = "Completed" if req.is_completed else "Pending"
    else:
        new_stat = req.status.strip() if req.status else task_dict["status"]

    new_pri = req.priority.strip() if req.priority else task_dict["priority"]
    new_title = req.title.strip() if req.title else task_dict["title"]

    cursor.execute("""
    UPDATE case_tasks SET status = ?, priority = ?, title = ? WHERE id = ?
    """, (new_stat, new_pri, new_title, task_id))
    conn.commit()
    conn.close()
    return {"id": task_id, "status": new_stat, "priority": new_pri, "title": new_title, "is_completed": new_stat.lower() in ["completed", "done"]}

