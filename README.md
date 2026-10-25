# VIDHIVRAKSH — Multilingual AI Legal Awareness Assistant for India

> **Tagline:** Law, made approachable.

VIDHIVRAKSH is an AI-powered legal-awareness web application that makes Indian statutory information, constitutional rights, and the new legal codes (**Bharatiya Nyaya Sanhita (BNS)**, **Bharatiya Nagarik Suraksha Sanhita (BNSS)**, and **Bharatiya Sakshya Adhiniyam (BSA)**) approachable, clear, and grounded.

---

## 🎨 Visual Design Inspiration

Inspired by a midnight-blue, cosmic aesthetic featuring:
- **Atmosphere:** Cinematic midnight-navy, deep indigo, and electric blue with subtle cyan neon accents.
- **Hero & Constellations:** Deep starry celestial gradient with glowing nodes and subtle constellation lines representing legal connections.
- **Brand Identity:** Integrated electric-blue **Tree of Knowledge & Scales of Justice** emblem (`libra-emblem.jpg`).
- **Typography:** Crisp, clean sans-serif with native glyph support for Latin, Devanagari, Bengali, Tamil, and Telugu scripts.

---

## 🌐 Multilingual Support (6 Indian Languages)

| Language | Display Name (Native Script) | Code | Script |
| :--- | :--- | :--- | :--- |
| **English** | English | `en` | Latin |
| **Hindi** | हिन्दी | `hi` | Devanagari |
| **Bengali** | বাংলা | `bn` | Bengali |
| **Tamil** | தமிழ் | `ta` | Tamil |
| **Marathi** | मराठी | `mr` | Devanagari |
| **Telugu** | తెలుగు | `te` | Telugu |

- **Default Language:** English (`en`).
- **Fallback Rule:** Unsupported languages (e.g. `fr`, `de`) fall back gracefully to `en`.
- **Dialect Handling:** Locales such as `hi-IN` or `ta-IN` resolve seamlessly to base language codes.
- **Persistence:** Visitor language selections persist locally in `localStorage` without page reloads.

---

## 🛠 Technology Stack

- **Frontend:** Next.js (App Router, React, TypeScript, Tailwind CSS, Lucide Icons)
- **Backend:** Python, FastAPI, Pydantic, SQLite
- **Architecture:** Local deterministic legal retrieval and answer templates (No external LLM or paid services required)
- **Security:** Strict separation between server secrets and client bundles

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (3.9+)

### 2. Backend Setup
```bash
# Activate virtual environment
source .venv/bin/activate

# Run backend development server
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Health endpoint: `http://localhost:8000/health`  
Interactive Swagger docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the application.

---

## 🧪 Phase 1 Test Execution

### Backend Tests
```bash
PYTHONPATH=backend ./.venv/bin/pytest backend/tests -v
```
**Tests Executed:**
1. `test_health_check_returns_200_and_json`: `GET /health` returns HTTP 200 and `{ status: "ok" }`.
2. `test_language_configuration_recognizes_all_six_codes`: Confirms `en, hi, bn, ta, mr, te` are recognized.
3. `test_unsupported_language_falls_back_to_english`: Setting language to `fr` returns `en`.
4. `test_configuration_safety_no_server_secrets_in_public_endpoint`: Verifies `SECRET_KEY` and DB credentials are not exposed to the browser.

### Frontend Tests
```bash
cd frontend
npm test
npm run build
```
**Tests Executed:**
1. All 6 language dictionary JSON files loaded and verified.
2. Fallback to English for unsupported language codes.
3. Client configuration safety (no external AI credentials required or leaked).
4. TypeScript & Webpack build verification (`0 errors`).
