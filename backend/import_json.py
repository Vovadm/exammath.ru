import asyncio
from contextlib import asynccontextmanager
import json
import os
import sys

if not os.getenv("DATABASE_URL"):
    from dotenv import load_dotenv

    load_dotenv()

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import hash_password
from backend.database import Base, async_session, engine
from backend.models import Task, User, UserStats


@asynccontextmanager
async def _get_session(db_session: AsyncSession | None):
    if db_session is not None:
        yield db_session
    else:
        async with async_session() as session:
            yield session


async def import_tasks(
    json_path: str, db_session: AsyncSession | None = None
) -> None:
    if db_session is None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    imported = 0
    skipped = 0

    async with _get_session(db_session) as db:
        for item in data:
            fipi_id = item.get("id", "")
            if not fipi_id:
                skipped += 1
                continue

            result = await db.execute(
                select(Task).where(Task.fipi_id == fipi_id)
            )
            if result.scalar_one_or_none():
                skipped += 1
                continue

            task = Task(
                fipi_id=fipi_id,
                guid=item.get("guid", ""),
                task_type=item.get("type", 0),
                text=item.get("text", ""),
                hint=item.get("hint", ""),
                answer=item.get("answer"),
                images=item.get("images", []),
                inline_images=item.get("inline_images", []),
                tables=item.get("tables", []),
            )
            db.add(task)
            imported += 1

        await db.flush()

        if db_session is None:
            await db.commit()

    print(f"Импортировано: {imported}, пропущено: {skipped}")


async def create_admin() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    username = os.getenv("ADMIN_USERNAME", "admin")
    email = os.getenv("ADMIN_EMAIL", "admin@exammath.local")
    password = os.getenv("ADMIN_PASSWORD", "admin123")

    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.username == username)
        )
        if result.scalar_one_or_none():
            print(f"Админ '{username}' уже существует")
            return

        admin_user = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            role="admin",
        )
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)

        stats = UserStats(user_id=admin_user.id)
        db.add(stats)
        await db.commit()

        print(f"Админ создан: {username} / {password}")


async def main() -> None:
    try:
        await create_admin()
        path = sys.argv[1] if len(sys.argv) > 1 else "../fipi_questions.json"
        await import_tasks(path)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
