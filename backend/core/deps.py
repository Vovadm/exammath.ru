from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, require_role
from backend.database import get_db
from backend.domain.models.user import User

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_role("admin"))]
TeacherOrAdmin = Annotated[User, Depends(require_role("admin", "teacher"))]
