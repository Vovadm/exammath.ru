from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TaskResponse(BaseModel):
    id: int
    fipi_id: str
    guid: Optional[str] = None
    task_type: int
    text: str
    hint: Optional[str] = None
    answer: Optional[str] = None
    images: list[Any] = Field(default_factory=list)
    inline_images: list[Any] = Field(default_factory=list)
    tables: list[Any] = Field(default_factory=list)

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    text: Optional[str] = None
    task_type: Optional[int] = None
    answer: Optional[str] = None
    hint: Optional[str] = None


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    pages: int


class SolutionFileResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    file_type: Optional[str] = None

    class Config:
        from_attributes = True


class SolutionCreate(BaseModel):
    task_id: int
    answer: Optional[str] = None
    content: list[Any] = Field(default_factory=list)


class SolutionResponse(BaseModel):
    id: int
    user_id: int
    task_id: int
    answer: Optional[str] = None
    is_correct: Optional[bool] = None
    content: list[Any] = Field(default_factory=list)
    files: list[SolutionFileResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    username: Optional[str] = None

    class Config:
        from_attributes = True


class CheckAnswerRequest(BaseModel):
    task_id: int
    answer: str


class CheckAnswerResponse(BaseModel):
    correct: bool
    correct_answer: Optional[str] = None


class VariantCreate(BaseModel):
    title: str
    description: Optional[str] = None
    task_ids: list[int]


class VariantResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    created_by: int
    created_at: datetime
    tasks: list[TaskResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class UserStatsResponse(BaseModel):
    total_attempts: int = 0
    correct_attempts: int = 0
    tasks_solved: int = 0
    accuracy: float = 0.0
    streak_current: int = 0
    streak_max: int = 0
    last_activity: Optional[datetime] = None
    stats_by_type: dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class ClassCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ClassAddMember(BaseModel):
    user_id: int
    role: str = "student"


class ClassMemberResponse(BaseModel):
    id: int
    user_id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True


class ClassResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_by: int
    created_at: datetime
    members: list[ClassMemberResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
