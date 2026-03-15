from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class UserStatsResponse(BaseModel):
    total_attempts: int = 0
    correct_attempts: int = 0
    tasks_solved: int = 0
    accuracy: float = 0.0
    streak_current: int = 0
    streak_max: int = 0
    last_activity: Optional[datetime] = None
    stats_by_type: dict[str, Any] = Field(default_factory=dict)


class TypeStatItem(BaseModel):
    task_type: int
    attempts: int
    correct: int
    success_rate: float
