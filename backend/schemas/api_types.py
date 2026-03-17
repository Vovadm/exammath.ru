from pydantic import BaseModel
from backend.schemas.task import TaskResponse

class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    pages: int