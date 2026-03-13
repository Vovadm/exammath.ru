from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
