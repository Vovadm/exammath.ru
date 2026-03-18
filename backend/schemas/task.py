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
    text: Optional[str] = Field(None, min_length=1)
    task_type: Optional[int] = Field(None, ge=0, le=19)
    answer: Optional[str] = None
    hint: Optional[str] = None


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    pages: int


class TaskSearchQuery(BaseModel):
    search: Optional[str] = Field(None, max_length=100)
    task_type: Optional[int] = None
    page: int = Field(1, ge=1)
    per_page: int = Field(10, ge=1, le=50)
    filter: Optional[str] = None
