import jwt
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict
from fastapi import Depends, HTTPException, status, Header, Cookie
from pydantic import BaseModel, EmailStr

from app.config import settings
from app.db import get_connection

PRIVILEGED_ROLES = {"admin", "lawyer"}
VALID_ROLES = {"citizen", "business", "lawyer", "admin"}
VALID_MODES = {"normal", "professional"}
VALID_LANGUAGES = {"en", "hi", "bn", "ta", "mr", "te"}

# --- Pydantic Schemas ---
class SignUpRequest(BaseModel):
    email: str
    password: str
    confirm_password: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = "citizen"
    language: Optional[str] = "en"
    remember_me: Optional[bool] = False

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: Optional[bool] = False

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    code: str
    name: Optional[str] = None
    role: Optional[str] = "citizen"
    language: Optional[str] = "en"
    remember_me: Optional[bool] = False

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    language: Optional[str] = None
    mode: Optional[str] = None

class ChatMessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    content: str
    language: Optional[str] = None
    mode: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    mode: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    language: str
    mode: str
    subscription: str
    status: str
    created_at: str
    updated_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ConversationCreate(BaseModel):
    title: str
    language: Optional[str] = "en"
    mode: Optional[str] = "normal"

class MessageCreate(BaseModel):
    content: str
    sources_json: Optional[str] = None

class DocumentCreate(BaseModel):
    filename: str
    file_type: str = "text/plain"
    file_size: int = 1024
    content_snippet: Optional[str] = None

# --- JWT Helpers ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- Dependency: Current Authenticated User ---
def get_current_user(
    authorization: Optional[str] = Header(None),
    session_cookie: Optional[str] = Cookie(None, alias="vidhivraksh_session"),
    legacy_cookie: Optional[str] = Cookie(None, alias="libra_session"),
) -> dict:
    raw_token = None
    if authorization and authorization.startswith("Bearer "):
        raw_token = authorization.split("Bearer ")[1].strip()
    elif session_cookie:
        raw_token = session_cookie
    elif legacy_cookie:
        raw_token = legacy_cookie

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(raw_token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token does not exist",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = dict(row)
    if user.get("status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact support.",
        )
    return user

def get_current_lawyer(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in ["lawyer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to authorized legal professionals."
        )
    return current_user

# --- Phase 6 Schemas ---
class ConsistencyCheckRequest(BaseModel):
    text: str

class LandResearchCreate(BaseModel):
    entry_name: Optional[str] = None
    state: str
    district: str
    locality: Optional[str] = ""
    survey_number: Optional[str] = None
    property_description: Optional[str] = ""
    verification_status: Optional[str] = None
    notes: Optional[str] = None

class LandResearchUpdate(BaseModel):
    entry_name: Optional[str] = None
    status: Optional[str] = None
    verification_status: Optional[str] = None
    checklist_progress: Optional[List[str]] = None
    notes: Optional[str] = None
    property_description: Optional[str] = None

class CaseCreate(BaseModel):
    case_title: Optional[str] = None
    title: Optional[str] = None
    case_number: Optional[str] = None
    internal_ref: Optional[str] = None
    case_type: Optional[str] = "Civil"
    client_name: Optional[str] = None
    court: Optional[str] = None
    court_forum: Optional[str] = None
    jurisdiction: Optional[str] = None
    parties: Optional[str] = None
    opposing_party: Optional[str] = None
    opposing_counsel: Optional[str] = None
    stage: Optional[str] = "Pre-Trial / Evidence"
    summary: Optional[str] = ""
    status: Optional[str] = "active"
    next_deadline: Optional[str] = None
    next_hearing_date: Optional[str] = None

class CaseUpdate(BaseModel):
    case_title: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    next_deadline: Optional[str] = None
    next_hearing_date: Optional[str] = None
    summary: Optional[str] = None
    court_forum: Optional[str] = None

class TimelineEventCreate(BaseModel):
    event_type: Optional[str] = "Procedural"
    event_date: str
    title: Optional[str] = None
    description: Optional[str] = ""

class EvidenceDocumentCreate(BaseModel):
    title: str
    category: Optional[str] = "General"
    document_type: Optional[str] = None
    date_received: Optional[str] = None
    source_origin: Optional[str] = "Client Submission"
    review_status: Optional[str] = "Not Reviewed"
    bates_number: Optional[str] = None
    relevance: Optional[str] = None
    description: Optional[str] = None

class CaseNoteCreate(BaseModel):
    category: Optional[str] = "Research"
    title: Optional[str] = None
    content: str

class CaseTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Pending"
    is_completed: Optional[bool] = False

class CaseTaskUpdate(BaseModel):
    status: Optional[str] = None
    is_completed: Optional[bool] = None
    priority: Optional[str] = None
    title: Optional[str] = None

