from __future__ import annotations

import pytest

from backend.tests.conftest import make_task

pytestmark = pytest.mark.asyncio


class TestGetSingleTask:
    async def test_get_task_by_id(self, client, db_session):
        task = await make_task(
            db_session, task_type=5, text="Найдите значение", answer="42"
        )
        resp = await client.get(f"/api/tasks/{task.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == task.id
        assert data["task_type"] == 5
        assert data["text"] == "Найдите значение"
        assert data["answer"] == "42"

    async def test_get_task_includes_all_fields(self, client, db_session):
        task = await make_task(db_session)
        resp = await client.get(f"/api/tasks/{task.id}")
        data = resp.json()
        for field in (
            "id",
            "fipi_id",
            "task_type",
            "text",
            "answer",
            "images",
            "tables",
        ):
            assert field in data


class TestTaskFilters:
    async def test_filter_untyped(self, client, db_session):
        await make_task(db_session, task_type=0, text="Без типа")
        resp = await client.get("/api/tasks", params={"filter": "untyped"})
        assert resp.status_code == 200
        for t in resp.json()["tasks"]:
            assert t["task_type"] == 0 or not (1 <= t["task_type"] <= 19)

    async def test_filter_no_answer(self, client, db_session):
        await make_task(
            db_session, task_type=5, text="Без ответа", answer=None
        )
        await make_task(
            db_session, task_type=3, text="Пустой ответ", answer=""
        )
        resp = await client.get("/api/tasks", params={"filter": "no_answer"})
        assert resp.status_code == 200
        for t in resp.json()["tasks"]:
            assert 1 <= t["task_type"] <= 12
            assert t["answer"] is None or t["answer"] == ""


class TestPaginationEdge:
    async def test_page_beyond_total(self, client, db_session):
        await make_task(db_session, task_type=18, text="Одинокий")
        resp = await client.get(
            "/api/tasks", params={"task_type": 18, "page": 9999}
        )
        assert resp.status_code == 200
        assert resp.json()["tasks"] == []

    async def test_per_page_one(self, client, db_session):
        await make_task(db_session, task_type=17, text="Один A")
        await make_task(db_session, task_type=17, text="Один B")
        resp = await client.get(
            "/api/tasks", params={"task_type": 17, "per_page": 1}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["tasks"]) == 1
        assert data["pages"] >= 2

    async def test_invalid_page_zero(self, client):
        resp = await client.get("/api/tasks", params={"page": 0})
        assert resp.status_code == 422

    async def test_invalid_per_page_zero(self, client):
        resp = await client.get("/api/tasks", params={"per_page": 0})
        assert resp.status_code == 422

    async def test_per_page_over_limit(self, client):
        resp = await client.get("/api/tasks", params={"per_page": 100})
        assert resp.status_code == 422

    async def test_default_pagination(self, client):
        resp = await client.get("/api/tasks")
        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == 1
        assert "total" in data
        assert "pages" in data


class TestTaskSearchCombined:
    async def test_search_and_type_combined(self, client, db_session):
        await make_task(db_session, task_type=9, text="Комби_поиск_уникальный")
        await make_task(
            db_session, task_type=10, text="Комби_поиск_уникальный"
        )

        resp = await client.get(
            "/api/tasks",
            params={"task_type": 9, "search": "Комби_поиск_уникальный"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        for t in data["tasks"]:
            assert t["task_type"] == 9

    async def test_search_no_results(self, client):
        resp = await client.get(
            "/api/tasks",
            params={"search": "абсолютно_несуществующий_текст_xyz_999"},
        )
        assert resp.status_code == 200
        assert resp.json()["total"] == 0
        assert resp.json()["tasks"] == []
