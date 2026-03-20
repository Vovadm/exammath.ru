from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fipi_id: str
    guid: Optional[str] = None
    task_type: int
    text: str
    images: list[Any] = Field(default_factory=list)
    inline_images: list[Any] = Field(default_factory=list)
    tables: list[Any] = Field(default_factory=list)
    likes: int
    dislikes: int
    total_attempts: int
    solved_count: int

    @computed_field
    def difficulty(self) -> int:
        if self.total_attempts == 0:
            return 0
        failed_users = self.total_attempts - self.solved_count
        return int(round((failed_users / self.total_attempts) * 100))


class TaskAdminResponse(TaskResponse):
    answer: Optional[str] = None
    hint: Optional[str] = None


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


class TaskAdminListResponse(BaseModel):
    tasks: list[TaskAdminResponse]
    total: int
    page: int
    pages: int


class TaskSearchQuery(BaseModel):
    search: Optional[str] = Field(None, max_length=100)
    task_type: Optional[int] = None
    page: int = Field(1, ge=1)
    per_page: int = Field(10, ge=1, le=50)
    filter: Optional[str] = None


class VoteRequest(BaseModel):
    vote: Optional[str] = None
