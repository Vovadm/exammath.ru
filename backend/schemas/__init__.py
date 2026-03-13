from backend.schemas.auth import (
    ChangePasswordRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)
from backend.schemas.class_ import (
    ClassAddMember,
    ClassCreate,
    ClassMemberResponse,
    ClassResponse,
)
from backend.schemas.solution import (
    CheckAnswerRequest,
    CheckAnswerResponse,
    SolutionCreate,
    SolutionFileResponse,
    SolutionResponse,
)
from backend.schemas.stats import TypeStatItem, UserStatsResponse
from backend.schemas.task import TaskListResponse, TaskResponse, TaskUpdate
from backend.schemas.variant import (
    VariantCreate,
    VariantResponse,
    VariantStudentSolutionResponse,
)

__all__ = [
    "ChangePasswordRequest",
    "Token",
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "ClassAddMember",
    "ClassCreate",
    "ClassMemberResponse",
    "ClassResponse",
    "CheckAnswerRequest",
    "CheckAnswerResponse",
    "SolutionCreate",
    "SolutionFileResponse",
    "SolutionResponse",
    "TypeStatItem",
    "UserStatsResponse",
    "TaskListResponse",
    "TaskResponse",
    "TaskUpdate",
    "VariantCreate",
    "VariantResponse",
    "VariantStudentSolutionResponse",
]
