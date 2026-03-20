from datetime import datetime, timezone
import os
import uuid

from fastapi import HTTPException, UploadFile

from backend.core.config import UPLOAD_DIR
from backend.image_utils import compress_image
from backend.repositories.solution_repo import SolutionRepository
from backend.repositories.task_repo import TaskRepository
from backend.repositories.user_repo import UserRepository
from backend.schemas.solution import (
    CheckAnswerResponse,
    SolutionCreate,
    SolutionFileResponse,
    SolutionResponse,
)


class SolutionService:
    def __init__(
        self,
        solution_repo: SolutionRepository,
        task_repo: TaskRepository,
        user_repo: UserRepository,
    ) -> None:
        self._solutions = solution_repo
        self._tasks = task_repo
        self._users = user_repo

    def _is_answer_correct(self, expected: str | None, actual: str) -> bool:
        if not expected:
            return False
        return (
            actual.strip().replace(",", ".").lower()
            == expected.strip().replace(",", ".").lower()
        )

    async def _update_task_stats(
        self, task, correct: bool, is_first_try: bool, has_solved_before: bool
    ) -> None:
        need_update = False
        if is_first_try:
            task.total_attempts += 1
            need_update = True

        if correct and not has_solved_before:
            task.solved_count += 1
            need_update = True

        if need_update:
            await self._tasks.update(task)

    async def _update_user_stats(
        self,
        user_id: int,
        correct: bool,
        has_solved_before: bool,
        task_type: int,
    ) -> None:
        stats = await self._users.get_stats(user_id)
        if not stats:
            stats = await self._users.create_stats(user_id)

        stats.total_attempts += 1
        stats.last_activity = datetime.now(timezone.utc)

        if correct:
            stats.correct_attempts += 1
            stats.streak_current += 1
            if stats.streak_current > stats.streak_max:
                stats.streak_max = stats.streak_current
            if not has_solved_before:
                stats.tasks_solved += 1
        else:
            stats.streak_current = 0

        type_key = str(task_type)
        by_type = dict(stats.stats_by_type) if stats.stats_by_type else {}
        by_type.setdefault(type_key, {"attempts": 0, "correct": 0})
        by_type[type_key]["attempts"] += 1
        if correct:
            by_type[type_key]["correct"] += 1
        stats.stats_by_type = by_type

        await self._users.save_stats(stats)

    async def check_answer(
        self, task_id: int, answer: str, user_id: int
    ) -> CheckAnswerResponse:
        task = await self._tasks.get_by_id(task_id)
        if not task:
            raise HTTPException(404, "Задание не найдено")

        correct = self._is_answer_correct(task.answer, answer)

        existing_solutions = await self._solutions.get_user_task_solutions(
            user_id, task_id
        )
        is_first_try = len(existing_solutions) == 0
        has_solved_before = any(s.is_correct for s in existing_solutions)

        await self._update_task_stats(
            task, correct, is_first_try, has_solved_before
        )
        await self._update_user_stats(
            user_id, correct, has_solved_before, task.task_type
        )

        await self._solutions.create(
            user_id=user_id, task_id=task_id, answer=answer, is_correct=correct
        )

        return CheckAnswerResponse(
            correct=correct,
            correct_answer=task.answer if not correct else None,
        )

    async def upsert(
        self, data: SolutionCreate, user_id: int
    ) -> SolutionResponse:
        task = await self._tasks.get_by_id(data.task_id)
        if not task:
            raise HTTPException(404, "Задание не найдено")

        existing = await self._solutions.get_latest_for_user_task(
            user_id, data.task_id
        )
        if existing:
            existing.content = data.content
            existing.answer = data.answer
            existing.updated_at = datetime.now(timezone.utc)
            solution = await self._solutions.save(existing)
        else:
            solution = await self._solutions.create(
                user_id=user_id,
                task_id=data.task_id,
                content=data.content,
                answer=data.answer,
            )
        return self._to_response(solution)

    async def get_my_solutions(
        self, user_id: int, task_id: int
    ) -> list[SolutionResponse]:
        solutions = await self._solutions.get_user_task_solutions(
            user_id, task_id
        )
        return [self._to_response(s) for s in solutions]

    async def get_all_for_task(self, task_id: int) -> list[SolutionResponse]:
        solutions = await self._solutions.get_all_for_task(task_id)
        return [self._to_response(s) for s in solutions]

    async def upload_file(
        self, solution_id: int, user_id: int, file: UploadFile
    ) -> dict:
        solution = await self._solutions.get_by_id(solution_id)
        if not solution or solution.user_id != user_id:
            raise HTTPException(404, "Решение не найдено")

        raw_bytes = await file.read()
        original_name = file.filename or "upload.jpg"

        try:
            compressed_bytes, compressed_name = compress_image(
                raw_bytes, original_name
            )
        except ValueError as e:
            raise HTTPException(413, str(e))

        ext = os.path.splitext(compressed_name)[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(UPLOAD_DIR, unique_name)

        with open(filepath, "wb") as f:
            f.write(compressed_bytes)

        sf = await self._solutions.add_file(
            solution_id=solution_id,
            filename=original_name,
            filepath=unique_name,
            file_type=file.content_type,
        )

        return {
            "id": sf.id,
            "filename": unique_name,
            "original": original_name,
        }

    def _to_response(self, s) -> SolutionResponse:
        files = [
            SolutionFileResponse(
                id=f.id,
                filename=f.filename,
                filepath=f.filepath,
                file_type=f.file_type,
            )
            for f in (s.files or [])
        ]
        return SolutionResponse(
            id=s.id,
            user_id=s.user_id,
            task_id=s.task_id,
            answer=s.answer,
            is_correct=s.is_correct,
            content=s.content or [],
            files=files,
            created_at=s.created_at,
            updated_at=s.updated_at,
            username=s.user.username if s.user else None,
        )

    async def delete(self, solution_id: int, user_id: int) -> None:
        solution = await self._solutions.get_by_id(solution_id)
        if not solution:
            raise HTTPException(404, "Решение не найдено")
        if solution.user_id != user_id:
            raise HTTPException(403, "Вы не можете удалить чужое решение")

        for f in getattr(solution, "files", []) or []:
            if not getattr(f, "filepath", None):
                continue
            file_path = os.path.join(UPLOAD_DIR, f.filepath)
            try:
                os.remove(file_path)
            except FileNotFoundError:
                pass
            except OSError:
                pass

        await self._solutions.delete(solution)
