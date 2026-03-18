import os
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.auth import (
    ACCESS_TOKEN_EXPIRE_DAYS,
    create_access_token,
    hash_password,
    verify_password,
)
from backend.core.config import IS_PROD
from backend.core.deps import CurrentUser, DbSession
from backend.domain.models.user import User
from backend.repositories.user_repo import UserRepository
from backend.schemas.auth import UserResponse, validate_password_strength
from backend.turnstile import verify_turnstile

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/auth", tags=["auth"])

COOKIE_MAX_AGE = ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
SAME_SITE_MODE: Literal["strict", "lax"] = "strict" if IS_PROD else "lax"


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=IS_PROD,
        samesite=SAME_SITE_MODE,
        max_age=COOKIE_MAX_AGE,
        path="/api",
    )


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^\w+$")
    email: EmailStr
    password: str = Field(min_length=8)
    turnstile_token: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)


class LoginRequest(BaseModel):
    username: str
    password: str
    turnstile_token: Optional[str] = None


async def _verify_captcha(token: Optional[str]) -> None:
    if token:
        if not await verify_turnstile(token):
            raise HTTPException(400, "Капча не пройдена")
    elif os.getenv("TURNSTILE_SECRET_KEY"):
        raise HTTPException(400, "Требуется пройти капчу")


@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
async def register(
    request: Request, data: RegisterRequest, response: Response, db: DbSession
) -> User:
    await _verify_captcha(data.turnstile_token)

    repo = UserRepository(db)
    if await repo.get_by_username(data.username):
        raise HTTPException(400, "Имя пользователя уже занято")
    if await repo.get_by_email(data.email):
        raise HTTPException(400, "Email уже зарегистрирован")

    user = await repo.create(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    await repo.create_stats(user.id)

    _set_auth_cookie(response, create_access_token({"sub": user.id}))
    return user


@router.post("/login", response_model=UserResponse)
@limiter.limit("10/minute")
async def login(
    request: Request, data: LoginRequest, response: Response, db: DbSession
) -> User:
    await _verify_captcha(data.turnstile_token)

    repo = UserRepository(db)
    user = await repo.get_by_username(data.username)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Неверный логин или пароль")

    _set_auth_cookie(response, create_access_token({"sub": user.id}))
    return user


@router.post("/logout")
async def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(
        key="access_token",
        path="/api",
        httponly=True,
        secure=IS_PROD,
        samesite=SAME_SITE_MODE,
    )
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser) -> User:
    return current_user
