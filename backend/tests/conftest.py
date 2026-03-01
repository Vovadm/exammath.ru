from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator

from faker import Faker
from httpx import ASGITransport, AsyncClient
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.auth import create_access_token, hash_password
from backend.database import Base, get_db
from backend.main import app
from backend.models import Task, User, UserStats

fake = Faker("ru_RU")

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSession = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with engine.connect() as conn:
        trans = await conn.begin()
        session = AsyncSession(bind=conn, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            await trans.rollback()


@pytest_asyncio.fixture()
async def client(
    db_session: AsyncSession,
) -> AsyncGenerator[AsyncClient, None]:

    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


async def _make_user(
    db: AsyncSession,
    role: str = "student",
    username: str | None = None,
    email: str | None = None,
    password: str = "TestPass123",
) -> tuple[User, str]:
    username = username or fake.unique.user_name()[:40]
    email = email or fake.unique.email()

    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        role=role,
    )
    db.add(user)
    await db.flush()

    stats = UserStats(user_id=user.id)
    db.add(stats)
    await db.flush()

    token = create_access_token({"sub": user.id})
    return user, token


@pytest_asyncio.fixture()
async def student(db_session: AsyncSession) -> tuple[User, str]:
    return await _make_user(db_session, role="student")


@pytest_asyncio.fixture()
async def teacher(db_session: AsyncSession) -> tuple[User, str]:
    return await _make_user(db_session, role="teacher")


@pytest_asyncio.fixture()
async def admin(db_session: AsyncSession) -> tuple[User, str]:
    return await _make_user(db_session, role="admin")


async def make_task(
    db: AsyncSession,
    fipi_id: str | None = None,
    task_type: int = 1,
    text: str = "Сколько будет 2+2?",
    answer: str | None = "4",
) -> Task:
    task = Task(
        fipi_id=fipi_id or fake.unique.bothify("FIPI-####"),
        task_type=task_type,
        text=text,
        answer=answer,
    )
    db.add(task)
    await db.flush()
    return task


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
