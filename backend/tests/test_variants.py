from __future__ import annotations

import pytest

from backend.tests.conftest import auth_headers, make_task

pytestmark = pytest.mark.asyncio


class TestVariantList:
    async def test_list_variants_empty(self, client, student):
        _, token = student
        resp = await client.get("/api/variants", headers=auth_headers(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_variants_returns_created(
        self, client, admin, db_session
    ):
        _, token = admin
        task = await make_task(db_session)
        await client.post(
            "/api/variants",
            json={"title": "Тестовый вариант", "task_ids": [task.id]},
            headers=auth_headers(token),
        )

        resp = await client.get("/api/variants", headers=auth_headers(token))
        assert resp.status_code == 200
        titles = [v["title"] for v in resp.json()]
        assert "Тестовый вариант" in titles


class TestVariantDetail:
    async def test_get_variant_by_id(self, client, admin, db_session):
        _, token = admin
        task = await make_task(db_session)
        create_resp = await client.post(
            "/api/variants",
            json={"title": "Детальный", "task_ids": [task.id]},
            headers=auth_headers(token),
        )
        variant_id = create_resp.json()["id"]

        resp = await client.get(f"/api/variants/{variant_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Детальный"
        assert len(data["tasks"]) == 1

    async def test_variant_preserves_task_order(
        self, client, admin, db_session
    ):
        _, token = admin
        t1 = await make_task(db_session, task_type=1, text="Первый")
        t2 = await make_task(db_session, task_type=2, text="Второй")
        t3 = await make_task(db_session, task_type=3, text="Третий")

        create_resp = await client.post(
            "/api/variants",
            json={
                "title": "Порядок",
                "task_ids": [t3.id, t1.id, t2.id],
            },
            headers=auth_headers(token),
        )
        variant_id = create_resp.json()["id"]

        resp = await client.get(f"/api/variants/{variant_id}")
        tasks = resp.json()["tasks"]
        assert tasks[0]["id"] == t3.id
        assert tasks[1]["id"] == t1.id
        assert tasks[2]["id"] == t2.id


class TestVariantPermissions:
    async def test_student_cannot_create_variant(
        self, client, student, db_session
    ):
        _, token = student
        task = await make_task(db_session)
        resp = await client.post(
            "/api/variants",
            json={"title": "Hack", "task_ids": [task.id]},
            headers=auth_headers(token),
        )
        assert resp.status_code == 403

    async def test_student_cannot_delete_variant(
        self, client, admin, student, db_session
    ):
        _, admin_token = admin
        _, student_token = student
        task = await make_task(db_session)
        create_resp = await client.post(
            "/api/variants",
            json={"title": "Удали", "task_ids": [task.id]},
            headers=auth_headers(admin_token),
        )
        variant_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/api/variants/{variant_id}",
            headers=auth_headers(student_token),
        )
        assert resp.status_code == 403

    async def test_anonymous_cannot_list_variants(self, client):
        resp = await client.get("/api/variants")
        assert resp.status_code == 401


class TestVariantBadInput:
    async def test_create_variant_with_nonexistent_task(self, client, admin):
        _, token = admin
        resp = await client.post(
            "/api/variants",
            json={"title": "Плохой", "task_ids": [999999]},
            headers=auth_headers(token),
        )
        assert resp.status_code == 400

    async def test_delete_nonexistent_variant(self, client, admin):
        _, token = admin
        resp = await client.delete(
            "/api/variants/999999",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_create_variant_empty_tasks(self, client, admin):
        _, token = admin
        resp = await client.post(
            "/api/variants",
            json={"title": "Пустой", "task_ids": []},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["tasks"] == []
