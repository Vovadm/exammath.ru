from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class SolutionFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    filepath: str
    file_type: Optional[str] = None


class SolutionCreate(BaseModel):
    task_id: int
    answer: Optional[str] = None
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
    task_id: int
    answer: str


class CheckAnswerResponse(BaseModel):
    correct: bool
    correct_answer: Optional[str] = None
