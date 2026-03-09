import os
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import (
    ACCESS_TOKEN_EXPIRE_DAYS,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.database import get_db
from backend.models import User, UserStats
from backend.schemas import UserResponse
from backend.turnstile import verify_turnstile

router = APIRouter(prefix="/api/auth", tags=["auth"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]

COOKIE_MAX_AGE = ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
IS_PROD = os.getenv("ENV", "production") == "production"


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=IS_PROD,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    turnstile_token: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    turnstile_token: Optional[str] = None


@router.post("/register", response_model=UserResponse)
async def register(
    data: RegisterRequest, response: Response, db: DbSession
) -> User:
    if data.turnstile_token:
        valid = await verify_turnstile(data.turnstile_token)
        if not valid:
            raise HTTPException(400, "Капча не пройдена")
    elif os.getenv("TURNSTILE_SECRET_KEY"):
        raise HTTPException(400, "Требуется пройти капчу")

    result = await db.execute(
        select(User).where(User.username == data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "Имя пользователя уже занято")

    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email уже зарегистрирован")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    stats = UserStats(user_id=user.id)
    db.add(stats)
    await db.commit()

    token = create_access_token({"sub": user.id})
    set_auth_cookie(response, token)
    return user


@router.post("/login", response_model=UserResponse)
async def login(data: LoginRequest, response: Response, db: DbSession) -> User:
    if data.turnstile_token:
        valid = await verify_turnstile(data.turnstile_token)
        if not valid:
            raise HTTPException(400, "Капча не пройдена")
    elif os.getenv("TURNSTILE_SECRET_KEY"):
        raise HTTPException(400, "Требуется пройти капчу")

    result = await db.execute(
        select(User).where(User.username == data.username)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Неверный логин или пароль")

    token = create_access_token({"sub": user.id})
    set_auth_cookie(response, token)
    return user


@router.post("/logout")
async def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(key="access_token", path="/")
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser) -> User:
    return current_user
