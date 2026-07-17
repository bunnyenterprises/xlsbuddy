import os
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
from fastapi import HTTPException, Depends, Header, Request
from typing import Optional

load_dotenv(str(Path(__file__).parent / ".env"))
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
JWT_EXP_MINUTES = 120
SESSION_COOKIE_NAME = os.environ.get('AUTH_COOKIE_NAME', 'xlsbuddy_session')


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXP_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    request: Request = None,
) -> str:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif request is not None:
        token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    return decode_token(token)
