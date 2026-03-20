from typing import Annotated, cast

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from backend.core.deps import CurrentUser, DbSession
from backend.domain.models.task import TaskVote
from backend.repositories.task_repo import TaskRepository
from backend.schemas.task import TaskListResponse, TaskResponse, VoteRequest

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=TaskListResponse)
async def get_tasks(
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=50)] = 10,
    task_type: Annotated[int | None, Query()] = None,
    search: Annotated[str | None, Query()] = None,
    filter: Annotated[str | None, Query()] = None,
) -> TaskListResponse:
    return cast(
        TaskListResponse,
        await TaskRepository(db).get_paginated(
            page=page,
            per_page=per_page,
            task_type=task_type,
            search=search,
            filter=filter,
        ),
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: DbSession) -> TaskResponse:
    task = await TaskRepository(db).get_by_id(task_id)
    if not task:
        raise HTTPException(404, "Задание не найдено")
    return TaskResponse.model_validate(task)


@router.get("/{task_id}/vote")
async def get_my_vote(
    task_id: int, current_user: CurrentUser, db: DbSession
) -> dict:
    result = await db.execute(
        select(TaskVote).where(
            TaskVote.user_id == current_user.id, TaskVote.task_id == task_id
        )
    )
    vote = result.scalar_one_or_none()
    return {"vote": vote.vote_type if vote else None}


@router.post("/{task_id}/vote")
async def vote_task(
    task_id: int, data: VoteRequest, current_user: CurrentUser, db: DbSession
) -> dict:
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id)
    if not task:
        raise HTTPException(404, "Задание не найдено")

    result = await db.execute(
        select(TaskVote).where(
            TaskVote.user_id == current_user.id, TaskVote.task_id == task_id
        )
    )
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        if existing_vote.vote_type == "like":
            task.likes = max(0, task.likes - 1)
        elif existing_vote.vote_type == "dislike":
            task.dislikes = max(0, task.dislikes - 1)

    if data.vote == "like":
        task.likes += 1
    elif data.vote == "dislike":
        task.dislikes += 1

    if data.vote is None:
        if existing_vote:
            await db.delete(existing_vote)
    else:
        if existing_vote:
            existing_vote.vote_type = data.vote
        else:
            new_vote = TaskVote(
                user_id=current_user.id, task_id=task_id, vote_type=data.vote
            )
            db.add(new_vote)

    await db.commit()
    return {
        "likes": task.likes,
        "dislikes": task.dislikes,
        "user_vote": data.vote,
    }
