from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(str(ROOT_DIR / '.env'))

from auth import hash_password, verify_password, create_token, get_current_user_id
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

GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

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


# ============= AUTH =============
def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "is_admin": bool(user.get("is_admin")) or user.get("email", "").lower() == ADMIN_EMAIL,
        "is_pro": bool(user.get("is_pro")),
        "pro_since": user.get("pro_since"),
    }


@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    is_admin = req.email.lower() == ADMIN_EMAIL
    user_doc = {
        "id": user_id,
        "email": req.email.lower(),
        "name": req.name,
        "password_hash": hash_password(req.password),
        "is_admin": is_admin,
        "is_pro": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    return AuthResponse(token=token, user=public_user(user_doc))


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # Auto-promote admin email if not yet admin
    if not user.get("is_admin") and user.get("email", "").lower() == ADMIN_EMAIL:
        await db.users.update_one({"id": user["id"]}, {"$set": {"is_admin": True}})
        user["is_admin"] = True
    token = create_token(user["id"])
    return AuthResponse(token=token, user=public_user(user))


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
async def get_function(func_id: str):
    func = await db.excel_functions.find_one({"id": func_id}, {"_id": 0})
    if not func:
        raise HTTPException(status_code=404, detail="Function not found")
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
async def get_tutorial(tut_id: str):
    tut = await db.tutorials.find_one({"id": tut_id}, {"_id": 0})
    if not tut:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    return tut
@api_router.post("/admin/tutorials")
async def create_tutorial(payload: dict):
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
async def update_tutorial(tutorial_id: str, payload: dict):
    result = await db.tutorials.update_one(
        {"id": tutorial_id},
        {
            "$set": {
                "title": payload.get("title"),
                "summary": payload.get("summary", ""),
                "category": payload.get("category", ""),
                "content": payload.get("content", ""),
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Tutorial not found"
        )

    return {"success": True}

@api_router.delete("/admin/tutorials/{tutorial_id}")
async def delete_tutorial(tutorial_id: str):
    result = await db.tutorials.delete_one(
        {"id": tutorial_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Tutorial not found"
        )

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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def seed_db():
    # Auto-promote admin if user already exists
    await db.users.update_many(
        {"email": ADMIN_EMAIL},
        {"$set": {"is_admin": True}}
    )
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
        if t_sample and "is_pro" not in t_sample:
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
