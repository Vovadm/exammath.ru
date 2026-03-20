from typing import Annotated, cast

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import case, select, update

from backend.core.deps import CurrentUser, DbSession
from backend.domain.models.task import Task, TaskVote
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


def _calculate_deltas(
    old_vote: str | None, new_vote: str | None
) -> tuple[int, int]:
    d_likes = -1 if old_vote == "like" else 0
    d_dislikes = -1 if old_vote == "dislike" else 0

    if new_vote == "like":
        d_likes += 1
    elif new_vote == "dislike":
        d_dislikes += 1

    return d_likes, d_dislikes


async def _update_task_vote_record(
    db: DbSession,
    existing_vote: TaskVote | None,
    new_vote_type: str | None,
    user_id: int,
    task_id: int,
) -> None:
    if new_vote_type is None:
        if existing_vote:
            await db.delete(existing_vote)
        return

    if existing_vote:
        existing_vote.vote_type = new_vote_type
    else:
        db.add(
            TaskVote(user_id=user_id, task_id=task_id, vote_type=new_vote_type)
        )


@router.post("/{task_id}/vote")
async def vote_task(
    task_id: int, data: VoteRequest, current_user: CurrentUser, db: DbSession
) -> dict:
    task_exists = await db.scalar(select(Task.id).where(Task.id == task_id))
    if not task_exists:
        raise HTTPException(404, "Задание не найдено")

    result = await db.execute(
        select(TaskVote).where(
            TaskVote.user_id == current_user.id, TaskVote.task_id == task_id
        )
    )
    existing_vote = result.scalar_one_or_none()
    old_vote_type = existing_vote.vote_type if existing_vote else None

    delta_likes, delta_dislikes = _calculate_deltas(old_vote_type, data.vote)

    if delta_likes != 0 or delta_dislikes != 0:
        stmt = (
            update(Task)
            .where(Task.id == task_id)
            .values(
                likes=case(
                    (Task.likes + delta_likes < 0, 0),
                    else_=Task.likes + delta_likes,
                ),
                dislikes=case(
                    (Task.dislikes + delta_dislikes < 0, 0),
                    else_=Task.dislikes + delta_dislikes,
                ),
            )
        )
        await db.execute(stmt)

    await _update_task_vote_record(
        db, existing_vote, data.vote, current_user.id, task_id
    )

    await db.commit()

    counts = await db.execute(
        select(Task.likes, Task.dislikes).where(Task.id == task_id)
    )
    likes, dislikes = counts.one()

    return {
        "likes": likes,
        "dislikes": dislikes,
        "user_vote": data.vote,
    }
