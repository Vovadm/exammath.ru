from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from backend.schemas.solution import SolutionFileResponse
from backend.schemas.task import TaskResponse


class VariantCreate(BaseModel):
    title: str
    description: Optional[str] = None
    task_ids: list[int]
    class_id: Optional[int] = None
    is_public: bool = False


class VariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    created_by: int
    class_id: Optional[int] = None
    is_public: bool = False
    created_at: datetime
    tasks: list[TaskResponse] = Field(default_factory=list)


class VariantStudentSolutionResponse(BaseModel):
    task_id: int
    task_type: int
    answer: Optional[str] = None
    is_correct: Optional[bool] = None
    content: list[Any] = Field(default_factory=list)
    files: list[SolutionFileResponse] = Field(default_factory=list)
