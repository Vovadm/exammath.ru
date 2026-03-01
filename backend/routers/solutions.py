from datetime import datetime, timezone
import os
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, require_role
from backend.database import get_db
from backend.image_utils import compress_image
from backend.models import Solution, SolutionFile, Task, User, UserStats
from backend.schemas import (
    CheckAnswerRequest,
    CheckAnswerResponse,
    SolutionCreate,
    SolutionFileResponse,
    SolutionResponse,
)

router = APIRouter(prefix="/api/solutions", tags=["solutions"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminOrTeacher = Annotated[User, Depends(require_role("admin", "teacher"))]
DbSession = Annotated[AsyncSession, Depends(get_db)]
Upload = Annotated[UploadFile, File(...)]


def solution_to_response(s: Solution) -> SolutionResponse:
    files = []
    if s.files:
        files = [
            SolutionFileResponse(
                id=f.id,
                filename=f.filename,
                filepath=f.filepath,
                file_type=f.file_type,
            )
            for f in s.files
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


@router.post("/check", response_model=CheckAnswerResponse)
async def check_answer(
    data: CheckAnswerRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> CheckAnswerResponse:
    task_result = await db.execute(select(Task).where(Task.id == data.task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Задание не найдено")

    correct = False
    if task.answer:
        user_ans = data.answer.strip().replace(",", ".").lower()
        correct_ans = task.answer.strip().replace(",", ".").lower()
        correct = user_ans == correct_ans

    stats_result = await db.execute(
        select(UserStats).where(UserStats.user_id == current_user.id)
    )
    stats = stats_result.scalar_one_or_none()
    if not stats:
        stats = UserStats(user_id=current_user.id)
        db.add(stats)

    stats.total_attempts += 1
    stats.last_activity = datetime.now(timezone.utc)

    if correct:
        stats.correct_attempts += 1
        stats.streak_current += 1
        if stats.streak_current > stats.streak_max:
            stats.streak_max = stats.streak_current
        existing_result = await db.execute(
            select(Solution).where(
                Solution.user_id == current_user.id,
                Solution.task_id == data.task_id,
                Solution.is_correct.is_(True),
            )
        )
        if not existing_result.scalar_one_or_none():
            stats.tasks_solved += 1
    else:
        stats.streak_current = 0

    type_key = str(task.task_type)
    by_type = dict(stats.stats_by_type) if stats.stats_by_type else {}
    if type_key not in by_type:
        by_type[type_key] = {"attempts": 0, "correct": 0}
    by_type[type_key]["attempts"] += 1
    if correct:
        by_type[type_key]["correct"] += 1
    stats.stats_by_type = by_type

    solution = Solution(
        user_id=current_user.id,
        task_id=data.task_id,
        answer=data.answer,
        is_correct=correct,
    )
    db.add(solution)
    await db.commit()

    return CheckAnswerResponse(
        correct=correct,
        correct_answer=task.answer if not correct else None,
    )


@router.post("", response_model=SolutionResponse)
async def save_solution(
    data: SolutionCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> SolutionResponse:
    task_result = await db.execute(select(Task).where(Task.id == data.task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Задание не найдено")

    solution_result = await db.execute(
        select(Solution)
        .where(
            Solution.user_id == current_user.id,
            Solution.task_id == data.task_id,
            Solution.is_correct.is_(None),
        )
        .order_by(Solution.created_at.desc())
    )
    existing = solution_result.scalar_one_or_none()

    if existing:
        existing.content = data.content
        existing.answer = data.answer
        existing.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing)
        return solution_to_response(existing)

    solution = Solution(
        user_id=current_user.id,
        task_id=data.task_id,
        content=data.content,
        answer=data.answer,
    )
    db.add(solution)
    await db.commit()
    await db.refresh(solution)
    return solution_to_response(solution)


@router.get("/task/{task_id}", response_model=list[SolutionResponse])
async def get_my_solutions(
    task_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> list[SolutionResponse]:
    result = await db.execute(
        select(Solution)
        .where(
            Solution.user_id == current_user.id,
            Solution.task_id == task_id,
        )
        .order_by(Solution.created_at.desc())
    )
    return [solution_to_response(s) for s in result.scalars().all()]


@router.get("/task/{task_id}/all", response_model=list[SolutionResponse])
async def get_all_solutions_for_task(
    task_id: int,
    current_user: AdminOrTeacher,
    db: DbSession,
) -> list[SolutionResponse]:
    result = await db.execute(
        select(Solution)
        .where(Solution.task_id == task_id)
        .order_by(Solution.created_at.desc())
    )
    return [solution_to_response(s) for s in result.scalars().all()]


@router.post("/upload/{solution_id}")
async def upload_file(
    solution_id: int,
    file: Upload,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, int | str]:
    result = await db.execute(
        select(Solution).where(
            Solution.id == solution_id, Solution.user_id == current_user.id
        )
    )
    solution = result.scalar_one_or_none()
    if not solution:
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

    sf = SolutionFile(
        solution_id=solution_id,
        filename=original_name,
        filepath=unique_name,
        file_type=file.content_type,
    )
    db.add(sf)
    await db.commit()

    original_kb = len(raw_bytes) / 1024
    compressed_kb = len(compressed_bytes) / 1024
    print(
        f"[IMG] {original_name}: {original_kb:.0f}KB"
        f" -> {compressed_kb:.0f}KB ({compressed_kb / original_kb * 100:.0f}%)"
    )

    return {"id": sf.id, "filename": unique_name, "original": original_name}
