from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SolutionFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    filepath: str
    file_type: Optional[str] = None


class SolutionCreate(BaseModel):
    task_id: int
    answer: Optional[str] = Field(None, max_length=2000)
    content: list[Any] = Field(default_factory=list)


class SolutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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


class CheckAnswerRequest(BaseModel):
    task_id: int = Field(gt=0)
    answer: str = Field(max_length=255)

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Ответ не может быть пустым")
        return v.strip()


class CheckAnswerResponse(BaseModel):
    correct: bool
    correct_answer: Optional[str] = None
