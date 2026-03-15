from fastapi import HTTPException

from backend.repositories.class_repo import ClassRepository
from backend.repositories.user_repo import UserRepository
from backend.schemas.class_ import (
    ClassAddMember,
    ClassCreate,
    ClassMemberResponse,
    ClassResponse,
)


class ClassService:
    def __init__(
        self, class_repo: ClassRepository, user_repo: UserRepository
    ) -> None:
        self._classes = class_repo
        self._users = user_repo

    async def create(
        self, data: ClassCreate, created_by: int
    ) -> ClassResponse:
        sc = await self._classes.create(
            data.name, data.description, created_by
        )
        return self._to_response(sc)

    async def get_list(self, user_id: int, role: str) -> list[ClassResponse]:
        if role == "admin":
            classes = await self._classes.get_all()
        elif role == "teacher":
            classes = await self._classes.get_for_teacher(user_id)
        else:
            classes = await self._classes.get_for_user(user_id)
        return [self._to_response(c) for c in classes]

    async def get_one(self, class_id: int) -> ClassResponse:
        sc = await self._classes.get_by_id(class_id)
        if not sc:
            raise HTTPException(404, "Класс не найден")
        return self._to_response(sc)

    async def add_member(
        self, class_id: int, data: ClassAddMember
    ) -> ClassMemberResponse:
        sc = await self._classes.get_by_id(class_id)
        if not sc:
            raise HTTPException(404, "Класс не найден")

        user = await self._users.get_by_id(data.user_id)
        if not user:
            raise HTTPException(404, "Пользователь не найден")

        existing = await self._classes.get_member(class_id, data.user_id)
        if existing:
            raise HTTPException(400, "Пользователь уже в классе")

        member = await self._classes.add_member(
            class_id, data.user_id, data.role
        )
        return ClassMemberResponse(
            id=member.id,
            user_id=user.id,
            username=user.username,
            email=user.email,
            role=member.role,
        )

    async def remove_member(self, class_id: int, user_id: int) -> None:
        member = await self._classes.get_member(class_id, user_id)
        if not member:
            raise HTTPException(404, "Участник не найден")
        await self._classes.remove_member(member)

    async def delete(self, class_id: int) -> None:
        sc = await self._classes.get_by_id(class_id)
        if not sc:
            raise HTTPException(404, "Класс не найден")
        await self._classes.delete(sc)

    def _to_response(self, sc) -> ClassResponse:
        members = [
            ClassMemberResponse(
                id=m.id,
                user_id=m.user.id,
                username=m.user.username,
                email=m.user.email,
                role=m.role,
            )
            for m in sc.members
        ]
        return ClassResponse(
            id=sc.id,
            name=sc.name,
            description=sc.description,
            created_by=sc.created_by,
            created_at=sc.created_at,
            members=members,
        )
