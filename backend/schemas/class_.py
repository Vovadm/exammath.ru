from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ClassCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ClassAddMember(BaseModel):
    user_id: int
    role: str = "student"


class ClassMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    username: str
    email: str
    role: str


class ClassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    created_by: int
    created_at: datetime
    members: list[ClassMemberResponse] = Field(default_factory=list)
