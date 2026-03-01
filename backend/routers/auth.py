import os
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.database import get_db
from backend.models import User, UserStats
from backend.schemas import Token, UserResponse
from backend.turnstile import verify_turnstile

router = APIRouter(prefix="/api/auth", tags=["auth"])
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    turnstile_token: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    turnstile_token: Optional[str] = None


@router.post("/register", response_model=Token)
async def register(data: RegisterRequest, db: DbSession) -> Token:
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
    return Token(access_token=token, token_type="bearer")


@router.post("/login", response_model=Token)
async def login(data: LoginRequest, db: DbSession) -> Token:
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
    return Token(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser) -> User:
    return current_user
