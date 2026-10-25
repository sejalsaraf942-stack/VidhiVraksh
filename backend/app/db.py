import sqlite3
import os
import json
from datetime import datetime, timezone
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    try:
        return pwd_context.verify(password, hashed_password)
    except Exception:
        return False

DB_PATH = os.getenv("LIBRA_DB_PATH") or os.path.abspath(os.path.join(os.path.dirname(__file__), "../../libra.db"))

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'citizen',
        language TEXT NOT NULL DEFAULT 'en',
        mode TEXT NOT NULL DEFAULT 'normal',
        subscription TEXT NOT NULL DEFAULT 'free',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # Safe migration: ensure password_hash, warning_count, and is_pro_entitled columns exist in users
    cursor.execute("PRAGMA table_info(users)")
    user_columns = [col[1] for col in cursor.fetchall()]
    if "password_hash" not in user_columns:
        cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    if "warning_count" not in user_columns:
        cursor.execute("ALTER TABLE users ADD COLUMN warning_count INTEGER DEFAULT 0")
    if "is_pro_entitled" not in user_columns:
        cursor.execute("ALTER TABLE users ADD COLUMN is_pro_entitled INTEGER DEFAULT 0")

    # 1b. Demo Entitlements and Simulated Checkout table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS demo_entitlements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        billing_interval TEXT NOT NULL,
        amount_inr INTEGER NOT NULL,
        is_simulated INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 2. Mock OTP table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS otp_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # 3. Conversations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'en',
        mode TEXT NOT NULL DEFAULT 'normal',
        is_terminated INTEGER DEFAULT 0,
        termination_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Safe migration: ensure is_terminated and termination_reason exist in conversations
    cursor.execute("PRAGMA table_info(conversations)")
    conv_columns = [col[1] for col in cursor.fetchall()]
    if "is_terminated" not in conv_columns:
        cursor.execute("ALTER TABLE conversations ADD COLUMN is_terminated INTEGER DEFAULT 0")
    if "termination_reason" not in conv_columns:
        cursor.execute("ALTER TABLE conversations ADD COLUMN termination_reason TEXT")

    # Phase 7: Account Warnings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS account_warnings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        conversation_id TEXT,
        message_id TEXT,
        rule_id TEXT NOT NULL,
        policy_category TEXT NOT NULL,
        warning_number INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Phase 7: Warning Reviews table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS warning_reviews (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        warning_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 4. Messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        sources_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
    """)

    # Safe migration: research trace and reply type stored alongside assistant messages
    cursor.execute("PRAGMA table_info(messages)")
    msg_columns = [col[1] for col in cursor.fetchall()]
    if "trace_json" not in msg_columns:
        cursor.execute("ALTER TABLE messages ADD COLUMN trace_json TEXT")
    if "message_type" not in msg_columns:
        cursor.execute("ALTER TABLE messages ADD COLUMN message_type TEXT")

    # 5. Uploaded Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS uploaded_documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        content_snippet TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 6. Legal Case Records table (30 Curated Landmark Judgments RAG foundation)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS legal_case_records (
        id TEXT PRIMARY KEY,
        case_title TEXT NOT NULL,
        citation TEXT NOT NULL,
        court TEXT NOT NULL,
        year INTEGER NOT NULL,
        statute TEXT,
        topic TEXT NOT NULL,
        key_question TEXT,
        facts_summary TEXT,
        summary TEXT NOT NULL,
        key_holding TEXT NOT NULL,
        legal_principle TEXT,
        why_it_matters TEXT,
        keywords_json TEXT NOT NULL,
        official_url TEXT,
        verification_status TEXT DEFAULT 'verified_landmark_precedent'
    );
    """)

    # Safe migration for legal_case_records columns
    cursor.execute("PRAGMA table_info(legal_case_records)")
    case_cols = [c[1] for c in cursor.fetchall()]
    for col_name in ["key_question", "facts_summary", "legal_principle", "why_it_matters", "verification_status"]:
        if col_name not in case_cols:
            cursor.execute(f"ALTER TABLE legal_case_records ADD COLUMN {col_name} TEXT")

    # 7. Safety Warnings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS safety_warnings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query_text TEXT NOT NULL,
        violation_type TEXT NOT NULL,
        strike_count INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 8. Subscriptions and usage limits table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free',
        queries_today INTEGER NOT NULL DEFAULT 0,
        query_limit INTEGER NOT NULL DEFAULT 15,
        last_reset_date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # --- Phase 6 Tables ---

    # 9. Legal Document Library table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS legal_documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        doc_type TEXT NOT NULL,
        jurisdiction TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'en',
        short_description TEXT NOT NULL,
        intended_purpose TEXT NOT NULL,
        typical_use_cases TEXT NOT NULL,
        important_clauses TEXT NOT NULL,
        plain_explanation TEXT NOT NULL,
        key_terms_json TEXT NOT NULL,
        potential_risks TEXT NOT NULL,
        required_docs TEXT NOT NULL,
        verification_status TEXT NOT NULL,
        is_template INTEGER NOT NULL DEFAULT 1,
        sample_content TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # 10. Land Ownership Research Entries table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS land_research_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        entry_name TEXT NOT NULL,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        locality TEXT NOT NULL,
        survey_number TEXT,
        property_description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Not Started',
        checklist_progress_json TEXT,
        notes TEXT,
        images_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 11. Lawyer Case Management tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lawyer_cases (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        case_title TEXT NOT NULL,
        internal_ref TEXT NOT NULL,
        case_type TEXT NOT NULL,
        court_forum TEXT,
        jurisdiction TEXT,
        parties TEXT NOT NULL,
        summary TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        next_deadline TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS case_timeline_events (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_date TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (case_id) REFERENCES lawyer_cases(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS case_evidence_documents (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        date_received TEXT NOT NULL,
        source_origin TEXT,
        review_status TEXT NOT NULL DEFAULT 'Not Reviewed',
        description TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (case_id) REFERENCES lawyer_cases(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS case_notes (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (case_id) REFERENCES lawyer_cases(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS case_tasks (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT,
        priority TEXT NOT NULL DEFAULT 'Medium',
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY (case_id) REFERENCES lawyer_cases(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    seed_demo_data(conn)
    conn.close()

def seed_demo_data(conn: sqlite3.Connection):
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    demo_pw_hash = hash_password("DemoPass123!")

    # Seed demo citizen Aarav Sharma
    cursor.execute("SELECT id FROM users WHERE id = 'user_demo_001'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, phone, role, language, mode, subscription, status, created_at, updated_at)
        VALUES ('user_demo_001', 'Aarav Sharma', 'aarav@example.test', ?, '+91 98765 43210', 'citizen', 'en', 'normal', 'free', 'active', ?, ?)
        """, (demo_pw_hash, now_iso, now_iso))

        cursor.execute("""
        INSERT INTO subscriptions (id, user_id, plan, queries_today, query_limit, last_reset_date)
        VALUES ('sub_demo_001', 'user_demo_001', 'free', 0, 15, ?)
        """, (now_iso[:10],))

    # Seed demo lawyer Advocate Priya Iyer
    cursor.execute("SELECT id FROM users WHERE id = 'user_demo_002'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, phone, role, language, mode, subscription, status, is_pro_entitled, created_at, updated_at)
        VALUES ('user_demo_002', 'Advocate Priya Iyer', 'priya.law@example.test', ?, '+91 98111 22334', 'lawyer', 'en', 'professional', 'professional', 'active', 1, ?, ?)
        """, (demo_pw_hash, now_iso, now_iso))

        cursor.execute("""
        INSERT INTO subscriptions (id, user_id, plan, queries_today, query_limit, last_reset_date)
        VALUES ('sub_demo_002', 'user_demo_002', 'professional', 0, 100, ?)
        """, (now_iso[:10],))
    else:
        cursor.execute("UPDATE users SET is_pro_entitled = 1, subscription = 'professional' WHERE id = 'user_demo_002'")

    # Ensure all lawyer and admin roles have is_pro_entitled = 1
    cursor.execute("UPDATE users SET is_pro_entitled = 1 WHERE role IN ('lawyer', 'admin')")

    # Ensure existing users without password_hash have a demo password set
    cursor.execute("UPDATE users SET password_hash = ? WHERE password_hash IS NULL", (demo_pw_hash,))

    # Seed sample conversation for Aarav Sharma
    cursor.execute("SELECT id FROM conversations WHERE id = 'conv_demo_001'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO conversations (id, user_id, title, language, mode, created_at, updated_at)
        VALUES ('conv_demo_001', 'user_demo_001', 'Rental Agreement Dispute Guidance', 'en', 'normal', ?, ?)
        """, (now_iso, now_iso))

        cursor.execute("""
        INSERT INTO messages (id, conversation_id, role, content, sources_json, created_at)
        VALUES ('msg_demo_001', 'conv_demo_001', 'user', 'Can my landlord deduct my entire security deposit without receipts?', NULL, ?)
        """, (now_iso,))

        sample_sources = json.dumps([
            {
                "title": "Model Tenancy Act & State Rent Control Guidelines",
                "section": "Section 13 (Security Deposit Regulations)",
                "summary": "Landlord must adjust only proven repairs and refund remaining deposit within 30 days."
            }
        ])
        cursor.execute("""
        INSERT INTO messages (id, conversation_id, role, content, sources_json, created_at)
        VALUES ('msg_demo_002', 'conv_demo_001', 'assistant', 'Under standard Indian tenancy principles and the Model Tenancy framework, a landlord cannot arbitrarily deduct your security deposit without providing itemized repair bills or legitimate proof of damage exceeding normal wear and tear.', ?, ?)
        """, (sample_sources, now_iso))

    # Seed sample document for Aarav Sharma
    cursor.execute("SELECT id FROM uploaded_documents WHERE id = 'doc_demo_001'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO uploaded_documents (id, user_id, filename, file_type, file_size, content_snippet, created_at)
        VALUES ('doc_demo_001', 'user_demo_001', 'Residential_Lease_Agreement_Draft.txt', 'text/plain', 4096, 'Clause 4: Security deposit of INR 50,000 to be refunded upon termination subject to inspection...', ?)
        """, (now_iso,))

    # Phase 6: Seed Legal Documents Library
    from app.phase6_data import SEED_LEGAL_DOCUMENTS, SEED_LAWYER_CASES
    for doc in SEED_LEGAL_DOCUMENTS:
        cursor.execute("SELECT id FROM legal_documents WHERE id = ?", (doc["id"],))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO legal_documents (
                id, title, category, doc_type, jurisdiction, language, short_description,
                intended_purpose, typical_use_cases, important_clauses, plain_explanation,
                key_terms_json, potential_risks, required_docs, verification_status,
                is_template, sample_content, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc["id"], doc["title"], doc["category"], doc["doc_type"], doc["jurisdiction"],
                doc["language"], doc["short_description"], doc["intended_purpose"],
                doc["typical_use_cases"], doc["important_clauses"], doc["plain_explanation"],
                doc["key_terms_json"], doc["potential_risks"], doc["required_docs"],
                doc["verification_status"], doc["is_template"], doc["sample_content"], now_iso
            ))

    # Phase 6: Seed Demo Lawyer Cases for Advocate Priya Iyer (user_demo_002)
    for c in SEED_LAWYER_CASES:
        cursor.execute("SELECT id FROM lawyer_cases WHERE id = ?", (c["id"],))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO lawyer_cases (
                id, user_id, case_title, internal_ref, case_type, court_forum,
                jurisdiction, parties, summary, status, next_deadline, created_at, updated_at
            ) VALUES (?, 'user_demo_002', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c["id"], c["case_title"], c["internal_ref"], c["case_type"],
                c["court_forum"], c["jurisdiction"], c["parties"], c["summary"],
                c["status"], c["next_deadline"], now_iso, now_iso
            ))

            # Seed timeline events
            for idx, ev in enumerate(c.get("timeline_events", [])):
                cursor.execute("""
                INSERT INTO case_timeline_events (id, case_id, event_type, event_date, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (f"ev_{c['id']}_{idx}", c["id"], ev["event_type"], ev["date"], ev["desc"], now_iso))

            # Seed evidence items
            for idx, ev_doc in enumerate(c.get("evidence_items", [])):
                cursor.execute("""
                INSERT INTO case_evidence_documents (id, case_id, title, category, date_received, source_origin, review_status, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (f"evd_{c['id']}_{idx}", c["id"], ev_doc["title"], ev_doc["category"], ev_doc["date_received"], "Client Submission", ev_doc["review_status"], "", now_iso))

            # Seed notes
            for idx, note in enumerate(c.get("notes", [])):
                cursor.execute("""
                INSERT INTO case_notes (id, case_id, category, content, created_at)
                VALUES (?, ?, ?, ?, ?)
                """, (f"note_{c['id']}_{idx}", c["id"], note["category"], note["content"], now_iso))

            # Seed tasks
            for idx, task in enumerate(c.get("tasks", [])):
                cursor.execute("""
                INSERT INTO case_tasks (id, case_id, title, description, due_date, priority, status, created_at)
                VALUES (?, ?, ?, '', ?, ?, ?, ?)
                """, (f"task_{c['id']}_{idx}", c["id"], task["title"], task["due_date"], task["priority"], task["status"], now_iso))

    # Phase 8-12: Seed 30 Landmark Case Records into legal_case_records
    from app.landmark_cases import LANDMARK_CASES
    for c in LANDMARK_CASES:
        cursor.execute("SELECT id FROM legal_case_records WHERE id = ?", (c["id"],))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO legal_case_records (
                id, case_title, citation, court, year, statute, topic,
                key_question, facts_summary, summary, key_holding, legal_principle,
                why_it_matters, keywords_json, official_url, verification_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c["id"], c["case_title"], c["citation"], c["court"], c["year"], c["statute"],
                c["topic"], c["key_question"], c["facts_summary"], c["summary"], c["key_holding"],
                c["legal_principle"], c["why_it_matters"], json.dumps(c["keywords_by_lang"]),
                c["official_url"], c["verification_status"]
            ))

    conn.commit()
