from __future__ import annotations

import pytest

from backend.tests.conftest import auth_headers, make_task

pytestmark = pytest.mark.asyncio


class Test404:
    async def test_task_not_found(self, client):
        resp = await client.get("/api/tasks/999999")
        assert resp.status_code == 404

    async def test_profile_not_found(self, client):
        resp = await client.get("/api/profile/user/999999")
        assert resp.status_code == 404

    async def test_variant_not_found(self, client):
        resp = await client.get("/api/variants/999999")
        assert resp.status_code == 404

    async def test_class_not_found(self, client, admin):
        _, token = admin
        resp = await client.get(
            "/api/classes/999999", headers=auth_headers(token)
        )
        assert resp.status_code == 404


class TestSQLInjection:
    async def test_search_with_special_chars(self, client):
        dangerous = "'; DROP TABLE tasks; --"
        resp = await client.get("/api/tasks", params={"search": dangerous})
        assert resp.status_code == 200

    async def test_search_with_percent(self, client):
        resp = await client.get("/api/tasks", params={"search": "100%"})
        assert resp.status_code == 200

    async def test_login_with_injection(self, client):
        resp = await client.post(
            "/api/auth/login",
            json={
                "username": "' OR 1=1 --",
                "password": "anything",
            },
        )
        assert resp.status_code == 401


class TestCorruptFiles:
    async def test_upload_corrupt_image(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session)
        sol_resp = await client.post(
            "/api/solutions",
            json={"task_id": task.id},
            headers=auth_headers(token),
        )
        sol_id = sol_resp.json()["id"]

        corrupt_bytes = b"\x00\x01\x02\xff" * 100
        resp = await client.post(
            f"/api/solutions/upload/{sol_id}",
            files={"file": ("bad.jpg", corrupt_bytes, "image/jpeg")},
            headers=auth_headers(token),
        )
        assert resp.status_code in (200, 400)


class TestLargePayload:
    async def test_long_answer_text(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session, answer="1")

        long_answer = "A" * 10_000
        resp = await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": long_answer},
            headers=auth_headers(token),
        )
        assert resp.status_code in (200, 422)

    async def test_long_solution_content(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session)
        big_content = [{"type": "text", "value": "x" * 1000}] * 50

        resp = await client.post(
            "/api/solutions",
            json={
                "task_id": task.id,
                "answer": "test",
                "content": big_content,
            },
            headers=auth_headers(token),
        )
        assert resp.status_code in (200, 422)
