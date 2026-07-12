from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(str(ROOT_DIR / '.env'))

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

from auth import hash_password, verify_password, create_token, get_current_user_id, SESSION_COOKIE_NAME, decode_token
from seed_data import EXCEL_FUNCTIONS, TUTORIALS
from admin import build_admin_router, ADMIN_EMAIL, get_settings, require_admin


mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)

db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

class ChatMessageRequest(BaseModel):
    content: str
    session_id: Optional[str] = None

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Conversation"

class FormulaRequest(BaseModel):
    description: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://www.xlsbuddy.com')
AUTH_COOKIE_NAME = os.environ.get('AUTH_COOKIE_NAME', 'xlsbuddy_session')
AUTH_COOKIE_SECURE = os.environ.get('AUTH_COOKIE_SECURE', 'true').lower() == 'true'
AUTH_COOKIE_SAMESITE = os.environ.get('AUTH_COOKIE_SAMESITE', 'none')
AUTH_COOKIE_DOMAIN = os.environ.get('AUTH_COOKIE_DOMAIN') or None
AUTH_COOKIE_PATH = os.environ.get('AUTH_COOKIE_PATH', '/')
AUTH_COOKIE_MAX_AGE = int(os.environ.get('AUTH_COOKIE_MAX_AGE', str(60 * 60 * 24 * 30)))

SYSTEM_PROMPT = """You are XLSBUDDY AI, an expert Excel assistant. You help users with:
- Excel formulas and functions (syntax, examples, troubleshooting)
- Common Excel tasks (pivot tables, lookups, conditional formatting, charts)
- Errors like #N/A, #DIV/0!, #VALUE!, #REF!, #NAME?
- Best practices and shortcuts

Always:
- Provide concrete formula examples in code blocks (use markdown ```excel ... ```).
- Explain the result and edge cases.
- Suggest a better/modern alternative when relevant (e.g., XLOOKUP over VLOOKUP).
- Keep answers focused and practical.
- If a question is not Excel-related, politely redirect to Excel topics."""


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        domain=AUTH_COOKIE_DOMAIN,
        path=AUTH_COOKIE_PATH,
        max_age=AUTH_COOKIE_MAX_AGE,
        expires=AUTH_COOKIE_MAX_AGE,
    )


async def get_optional_user(request: Request) -> Optional[dict]:
    """Returns the DB user doc if a valid session cookie is present, else None."""
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    try:
        user_id = decode_token(token)
        return await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    except Exception:
        return None


# ============= AUTH =============
def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "is_admin": bool(user.get("is_admin")),
        "is_pro": bool(user.get("is_pro")),
        "pro_since": user.get("pro_since"),
    }


@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(req: SignupRequest, response: Response):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": req.email.lower(),
        "name": req.name,
        "password_hash": hash_password(req.password),
        "is_admin": False,
        "is_pro": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    set_auth_cookie(response, token)
    return AuthResponse(token=token, user=public_user(user_doc))


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest, response: Response):
    user = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check lockout
    locked_until = user.get("locked_until")
    if locked_until:
        locked_dt = datetime.fromisoformat(locked_until)
        if datetime.now(timezone.utc) < locked_dt:
            mins = max(1, int((locked_dt - datetime.now(timezone.utc)).total_seconds() / 60) + 1)
            raise HTTPException(status_code=423, detail=f"Account locked. Try again in {mins} minute(s).")

    if not verify_password(req.password, user["password_hash"]):
        attempts = user.get("failed_login_attempts", 0) + 1
        update: dict = {"failed_login_attempts": attempts}
        if attempts >= 3:
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
            await db.users.update_one({"email": req.email.lower()}, {"$set": update})
            raise HTTPException(status_code=423, detail="Account locked for 30 minutes after 3 failed attempts.")
        await db.users.update_one({"email": req.email.lower()}, {"$set": update})
        left = 3 - attempts
        raise HTTPException(status_code=401, detail=f"Invalid password. {left} attempt(s) left before lockout.")

    # Success — clear lockout state
    await db.users.update_one(
        {"email": req.email.lower()},
        {"$set": {"failed_login_attempts": 0}, "$unset": {"locked_until": ""}}
    )
    token = create_token(user["id"])
    set_auth_cookie(response, token)
    return AuthResponse(token=token, user=public_user(user))


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path=AUTH_COOKIE_PATH,
        domain=AUTH_COOKIE_DOMAIN,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
    )
    return {"message": "Logged out"}


def _send_reset_email(to_email: str, name: str, reset_url: str):
    """Send password reset email via Gmail SMTP."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    gmail_user = os.environ.get("GMAIL_USER")
    gmail_pass = os.environ.get("GMAIL_APP_PASSWORD")
    if not gmail_user or not gmail_pass:
        raise ValueError("GMAIL_USER or GMAIL_APP_PASSWORD not set")

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="background:#002FA7;padding:16px 24px;margin-bottom:32px;">
        <span style="color:white;font-weight:900;font-size:18px;letter-spacing:1px;">XLSBUDDY</span>
      </div>
      <h2 style="color:#0f172a;margin:0 0 16px;">Reset your password</h2>
      <p style="color:#475569;line-height:1.6;">Hi {name},</p>
      <p style="color:#475569;line-height:1.6;">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a href="{reset_url}" style="display:inline-block;margin:24px 0;background:#002FA7;color:white;padding:14px 28px;font-weight:bold;text-decoration:none;font-size:15px;">
        Reset Password
      </a>
      <p style="color:#94a3b8;font-size:13px;">Or copy this link: {reset_url}</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:32px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your XLSBuddy password"
    msg["From"] = f"XLSBuddy <{gmail_user}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(gmail_user, gmail_pass)
        server.sendmail(gmail_user, to_email, msg.as_string())


@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    import secrets
    user = await db.users.find_one({"email": req.email.lower()})
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        await db.password_resets.insert_one({
            "token": token,
            "user_id": user["id"],
            "email": user["email"],
            "expires_at": expires_at,
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        try:
            _send_reset_email(user["email"], user["name"], reset_url)
            logger.info(f"Password reset email sent to {user['email']}")
        except Exception:
            logger.exception("Password reset email failed")
    # Always return success — prevents email enumeration
    return {"message": "If that email is registered, a reset link has been sent."}


@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    record = await db.password_resets.find_one({"token": req.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or already used reset link")
    expires_at = datetime.fromisoformat(record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")
    new_hash = hash_password(req.new_password)
    await db.users.update_one({"id": record["user_id"]}, {"$set": {"password_hash": new_hash}})
    await db.password_resets.update_one({"token": req.token}, {"$set": {"used": True}})
    return {"message": "Password reset successfully. You can now log in."}


@api_router.get("/auth/me")
async def me(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return public_user(user)


# ============= EXCEL FUNCTIONS =============
@api_router.get("/functions")
async def list_functions(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category and category.lower() != "all":
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"use_case": {"$regex": search, "$options": "i"}},
        ]
    funcs = await db.excel_functions.find(query, {"_id": 0}).sort("name", 1).to_list(500)
    return funcs
@api_router.post("/admin/formulas")
async def create_formula(payload: dict, user_id: str = Depends(get_current_user_id)):
    await require_admin(db, user_id)
    formula = {
        "id": str(uuid.uuid4()),
        "name": payload.get("name"),
        "category": payload.get("category"),
        "syntax": payload.get("syntax"),
        "description": payload.get("description", ""),
        "example": payload.get("example", ""),
        "difficulty": payload.get("difficulty", "Beginner"),
    }
    await db.excel_functions.insert_one(formula)
    formula.pop("_id", None)
    return formula

@api_router.put("/admin/formulas/{formula_id}")
async def update_formula(formula_id: str, payload: dict, user_id: str = Depends(get_current_user_id)):
    await require_admin(db, user_id)
    result = await db.excel_functions.update_one(
        {"id": formula_id},
        {
            "$set": {
                "name": payload.get("name"),
                "category": payload.get("category"),
                "syntax": payload.get("syntax"),
                "description": payload.get("description", ""),
                "example": payload.get("example", ""),
                "difficulty": payload.get("difficulty", "Beginner"),
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Formula not found")
    return {"success": True}

@api_router.delete("/admin/formulas/{formula_id}")
async def delete_formula(formula_id: str, user_id: str = Depends(get_current_user_id)):
    await require_admin(db, user_id)
    result = await db.excel_functions.delete_one({"id": formula_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Formula not found")
    return {"success": True}

@api_router.get("/functions/categories")
async def list_categories():
    cats = await db.excel_functions.distinct("category")
    return sorted(cats)


@api_router.get("/functions/{func_id}")
async def get_function(func_id: str, request: Request):
    func = await db.excel_functions.find_one({"id": func_id}, {"_id": 0})
    if not func:
        raise HTTPException(status_code=404, detail="Function not found")
    if func.get("is_pro"):
        user = await get_optional_user(request)
        if not user or (not user.get("is_pro") and not user.get("is_admin")):
            return {
                "id": func["id"],
                "name": func["name"],
                "category": func["category"],
                "description": func["description"],
                "is_pro": True,
                "gated": True,
            }
    return func


# ============= TUTORIALS =============
@api_router.get("/tutorials")
async def list_tutorials(search: Optional[str] = None):
    query = {}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"summary": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
        ]
    tuts = await db.tutorials.find(query, {"_id": 0}).to_list(200)
    return tuts


@api_router.get("/tutorials/{tut_id}")
async def get_tutorial(tut_id: str, request: Request):
    tut = await db.tutorials.find_one({"id": tut_id}, {"_id": 0})
    if not tut:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    if tut.get("is_pro"):
        user = await get_optional_user(request)
        if not user or (not user.get("is_pro") and not user.get("is_admin")):
            return {
                "id": tut["id"],
                "title": tut["title"],
                "category": tut["category"],
                "level": tut["level"],
                "summary": tut["summary"],
                "image_url": tut.get("image_url"),
                "is_pro": True,
                "gated": True,
            }
    return tut
@api_router.post("/admin/tutorials")
async def create_tutorial(payload: dict, user_id: str = Depends(get_current_user_id)):
    await require_admin(db, user_id)
    tutorial = {
        "id": str(uuid.uuid4()),
        "title": payload.get("title"),
        "summary": payload.get("summary", ""),
        "category": payload.get("category", ""),
        "content": payload.get("content", ""),
    }
    await db.tutorials.insert_one(tutorial.copy())
    return tutorial

@api_router.put("/admin/tutorials/{tutorial_id}")
async def update_tutorial(tutorial_id: str, payload: dict, user_id: str = Depends(get_current_user_id)):
    await require_admin(db, user_id)
    result = await db.tutorials.update_one(
        {"id": tutorial_id},
        {"$set": {
            "title": payload.get("title"),
            "summary": payload.get("summary", ""),
            "category": payload.get("category", ""),
            "content": payload.get("content", ""),
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    return {"success": True}

@api_router.delete("/admin/tutorials/{tutorial_id}")
async def delete_tutorial(tutorial_id: str, user_id: str = Depends(get_current_user_id)):
    await require_admin(db, user_id)
    result = await db.tutorials.delete_one({"id": tutorial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    return {"success": True}


# ============= AI CHAT =============
@api_router.get("/chat/sessions")
async def list_sessions(user_id: str = Depends(get_current_user_id)):
    sessions = await db.chat_sessions.find({"user_id": user_id}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return sessions


@api_router.post("/chat/sessions")
async def create_session(req: CreateSessionRequest, user_id: str = Depends(get_current_user_id)):
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {"id": session_id, "user_id": user_id, "title": req.title or "New Conversation", "created_at": now, "updated_at": now}
    await db.chat_sessions.insert_one(doc)
    return {"id": session_id, "title": doc["title"], "created_at": now, "updated_at": now}


@api_router.get("/chat/sessions/{session_id}/messages")
async def get_messages(session_id: str, user_id: str = Depends(get_current_user_id)):
    session = await db.chat_sessions.find_one({"id": session_id, "user_id": user_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    msgs = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return msgs


@api_router.delete("/chat/sessions/{session_id}")
async def delete_session(session_id: str, user_id: str = Depends(get_current_user_id)):
    session = await db.chat_sessions.find_one({"id": session_id, "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.chat_sessions.delete_one({"id": session_id, "user_id": user_id})
    await db.chat_messages.delete_many({"session_id": session_id})
    return {"ok": True}


@api_router.get("/chat/usage")
async def chat_usage(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    settings = await get_settings(db)
    limit = settings.get("free_daily_chat_limit", 5)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    count = user.get("daily_chat_count", 0) if user.get("daily_chat_date") == today else 0
    return {"is_pro": bool(user.get("is_pro")), "limit": None if user.get("is_pro") else limit, "used": count, "remaining": None if user.get("is_pro") else max(0, limit - count)}


@api_router.post("/chat/message")
async def send_message(req: ChatMessageRequest, user_id: str = Depends(get_current_user_id)):
    from groq import AsyncGroq

    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured. Add GROQ_API_KEY to environment variables.")

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.get("is_pro") and not user.get("is_admin"):
        settings = await get_settings(db)
        limit = settings.get("free_daily_chat_limit", 5)
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        count = user.get("daily_chat_count", 0) if user.get("daily_chat_date") == today else 0
        if count >= limit:
            raise HTTPException(status_code=402, detail=f"Free tier limit reached ({limit}/day). Upgrade to Pro for unlimited AI.")
        await db.users.update_one({"id": user_id}, {"$set": {"daily_chat_date": today, "daily_chat_count": count + 1}})

    session_id = req.session_id
    if not session_id:
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        title = req.content[:60] + ("..." if len(req.content) > 60 else "")
        await db.chat_sessions.insert_one({"id": session_id, "user_id": user_id, "title": title, "created_at": now, "updated_at": now})
    else:
        session = await db.chat_sessions.find_one({"id": session_id, "user_id": user_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    now = datetime.now(timezone.utc).isoformat()
    user_msg = {"id": str(uuid.uuid4()), "session_id": session_id, "role": "user", "content": req.content, "created_at": now}
    await db.chat_messages.insert_one(user_msg.copy())

    history = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(40)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + [
        {"role": m["role"], "content": m["content"]} for m in history
    ]

    try:
        groq_client = AsyncGroq(api_key=GROQ_API_KEY)
        completion = await groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1024,
        )
        ai_text = completion.choices[0].message.content
    except Exception as e:
        logging.exception("Groq API error")
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    ai_msg = {"id": str(uuid.uuid4()), "session_id": session_id, "role": "assistant", "content": ai_text, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.chat_messages.insert_one(ai_msg.copy())
    await db.chat_sessions.update_one({"id": session_id}, {"$set": {"updated_at": ai_msg["created_at"]}})

    return {"session_id": session_id, "user_message": {k: v for k, v in user_msg.items()}, "assistant_message": {k: v for k, v in ai_msg.items()}}


# ============= FORMULA GENERATOR =============
@api_router.post("/formula/generate")
async def generate_formula(req: FormulaRequest, user_id: str = Depends(get_current_user_id)):
    from groq import AsyncGroq
    import json, re

    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured. Add GROQ_API_KEY to environment variables.")

    if not req.description.strip():
        raise HTTPException(status_code=400, detail="Description is required")

    prompt = f"""The user wants an Excel formula for this task: "{req.description}"

Respond in this exact JSON format (no extra text):
{{
  "formula": "=THE_FORMULA_HERE",
  "explanation": "One or two sentence plain-English explanation of what it does.",
  "example": "A short concrete example, e.g. =SUMIF(B2:B10,\\"London\\",C2:C10)"
}}"""

    try:
        groq_client = AsyncGroq(api_key=GROQ_API_KEY)
        completion = await groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert Excel formula generator. Always respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=512,
        )
        raw = completion.choices[0].message.content
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON in response")
        return json.loads(match.group())
    except Exception as e:
        logging.exception("Formula generation error")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


# ============= ROOT =============
@api_router.get("/")
async def root():
    return {"message": "XLSBUDDY API", "status": "ok"}


# Mount admin/payments/reviews routes under /api
api_router.include_router(build_admin_router(db))

# Include main router
print("ROUTES REGISTERED:")
for route in api_router.routes:
    print(route.path)
app.include_router(api_router)

cors_origins_raw = os.environ.get('CORS_ORIGINS', 'https://xlsbuddy.vercel.app,http://localhost:3000')
cors_origins = [o.strip() for o in cors_origins_raw.split(',') if o.strip()]
cors_allow_credentials = os.environ.get('CORS_ALLOW_CREDENTIALS', 'true').lower() == 'true'

class CSRFMiddleware(BaseHTTPMiddleware):
    """Block cross-site requests by requiring a custom header on all state-changing calls."""
    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

    async def dispatch(self, request: Request, call_next):
        if request.method not in self.SAFE_METHODS:
            token = request.headers.get("X-Requested-With", "")
            if token != "XLSBuddy":
                return Response("CSRF check failed", status_code=403)
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add standard security headers to every response."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CSRFMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=cors_allow_credentials,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def seed_db():
    if ADMIN_PASSWORD:
        admin = await db.users.find_one({"email": ADMIN_EMAIL})
        if not admin:
            logger.info("Seeding admin user from environment")
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": ADMIN_EMAIL,
                "name": "Admin",
                "password_hash": hash_password(ADMIN_PASSWORD),
                "is_admin": True,
                "is_pro": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        elif not admin.get("is_admin"):
            await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"is_admin": True}})
    # Seed Excel functions — re-seed when count changed or schema fields missing
    db_count = await db.excel_functions.count_documents({})
    needs_reseed = db_count == 0 or db_count < len(EXCEL_FUNCTIONS)
    if not needs_reseed:
        sample = await db.excel_functions.find_one({}, {"_id": 0})
        if sample and (
            "visual_example" not in sample
            or "video_url" not in sample
            or "simple_explanation" not in sample
            or not sample.get("simple_explanation_hindi")
            or "is_pro" not in sample
        ):
            needs_reseed = True
    if needs_reseed:
        await db.excel_functions.delete_many({})
        docs = [{**f, "id": str(uuid.uuid4())} for f in EXCEL_FUNCTIONS]
        await db.excel_functions.insert_many(docs)
        logger.info(f"Seeded {len(docs)} Excel functions")
    # Re-seed tutorials if is_pro field is missing
    needs_tutorial_reseed = await db.tutorials.count_documents({}) == 0
    if not needs_tutorial_reseed:
        t_sample = await db.tutorials.find_one({}, {"_id": 0})
        if t_sample and ("is_pro" not in t_sample or "image_url" not in t_sample):
            needs_tutorial_reseed = True
    if needs_tutorial_reseed:
        await db.tutorials.delete_many({})
        docs = [{**t, "id": str(uuid.uuid4())} for t in TUTORIALS]
        await db.tutorials.insert_many(docs)
        logger.info(f"Seeded {len(docs)} tutorials")
    # Initialize settings singleton
    await get_settings(db)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
