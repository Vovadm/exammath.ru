from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
