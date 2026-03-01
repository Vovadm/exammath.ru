from __future__ import annotations

import json
import tempfile

import pytest
from sqlalchemy import select

from backend.import_json import import_tasks
from backend.models import Task
from backend.tests.conftest import auth_headers, make_task

pytestmark = pytest.mark.asyncio


class TestImportJSON:
    async def test_import_tasks_from_json(self, db_session):
        sample = [
            {
                "id": "FIPI-TEST-001",
                "guid": "abc-123",
                "type": 5,
                "text": "Найдите значение выражения",
                "hint": "Упростите",
                "answer": "42",
                "images": ["img1.png"],
                "inline_images": [],
                "tables": [],
            },
            {
                "id": "FIPI-TEST-002",
                "guid": "def-456",
                "type": 7,
                "text": "Решите уравнение",
                "hint": "",
                "answer": "3",
                "images": [],
                "inline_images": [],
                "tables": [{"rows": [["a", "b"]]}],
            },
        ]
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as f:
            json.dump(sample, f, ensure_ascii=False)
            tmp_path = f.name

        await import_tasks(tmp_path, db_session)

        result = await db_session.execute(
            select(Task).where(Task.fipi_id == "FIPI-TEST-001")
        )
        task = result.scalar_one_or_none()
        assert task is not None
        assert task.task_type == 5
        assert task.answer == "42"
        assert task.guid == "abc-123"

    async def test_import_skips_duplicates(self, db_session):
        sample = [
            {
                "id": "FIPI-DUP-001",
                "type": 1,
                "text": "Задача-дубликат",
                "answer": "1",
            }
        ]
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as f:
            json.dump(sample, f)
            tmp_path = f.name

        await import_tasks(tmp_path, db_session)
        await import_tasks(tmp_path, db_session)


class TestTaskCRUD:
    async def test_admin_can_update_task(self, client, admin, db_session):
        _, token = admin
        task = await make_task(db_session)

        resp = await client.put(
            f"/api/admin/tasks/{task.id}",
            json={"text": "Обновлённый текст задачи", "answer": "100"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["text"] == "Обновлённый текст задачи"
        assert data["answer"] == "100"

    async def test_update_nonexistent_task(self, client, admin):
        _, token = admin
        resp = await client.put(
            "/api/admin/tasks/999999",
            json={"text": "new"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_student_cannot_update_task(
        self, client, student, db_session
    ):
        _, token = student
        task = await make_task(db_session)
        resp = await client.put(
            f"/api/admin/tasks/{task.id}",
            json={"text": "hack"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 403


class TestVariants:
    async def test_create_variant(self, client, admin, db_session):
        _, token = admin
        t1 = await make_task(db_session, task_type=1, text="Тип 1")
        t2 = await make_task(db_session, task_type=5, text="Тип 5")
        t3 = await make_task(db_session, task_type=12, text="Тип 12")

        resp = await client.post(
            "/api/variants",
            json={
                "title": "ЕГЭ Вариант 1",
                "task_ids": [t1.id, t2.id, t3.id],
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["tasks"]) == 3
        task_types = {t["task_type"] for t in data["tasks"]}
        assert task_types == {1, 5, 12}

    async def test_delete_variant(self, client, admin, db_session):
        _, token = admin
        task = await make_task(db_session)
        create_resp = await client.post(
            "/api/variants",
            json={"title": "Удали меня", "task_ids": [task.id]},
            headers=auth_headers(token),
        )
        variant_id = create_resp.json()["id"]

        del_resp = await client.delete(
            f"/api/variants/{variant_id}",
            headers=auth_headers(token),
        )
        assert del_resp.status_code == 200

        get_resp = await client.get(f"/api/variants/{variant_id}")
        assert get_resp.status_code == 404


class TestTaskSearch:
    async def test_search_by_task_type(self, client, db_session):
        await make_task(db_session, task_type=7, text="Тип семь")
        resp = await client.get("/api/tasks", params={"task_type": 7})
        assert resp.status_code == 200
        data = resp.json()
        for t in data["tasks"]:
            assert t["task_type"] == 7

    async def test_search_by_text(self, client, db_session):
        await make_task(
            db_session,
            text="Уникальная_задача_для_поиска_XYZ",
            task_type=1,
        )
        resp = await client.get(
            "/api/tasks", params={"search": "Уникальная_задача_для_поиска_XYZ"}
        )
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    async def test_pagination(self, client, db_session):
        for i in range(5):
            await make_task(db_session, task_type=19, text=f"Пагинация {i}")

        resp = await client.get(
            "/api/tasks", params={"task_type": 19, "per_page": 2, "page": 1}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["tasks"]) <= 2
        assert data["pages"] >= 1
