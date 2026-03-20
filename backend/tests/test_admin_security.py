from __future__ import annotations

import pytest

from backend.tests.conftest import auth_headers, make_task

pytestmark = pytest.mark.asyncio


class TestAdminSecurity:
    async def test_student_cannot_access_admin_tasks(self, client, student):
        _, token = student
        resp = await client.get(
            "/api/admin/tasks", headers=auth_headers(token)
        )
        assert resp.status_code == 403

    async def test_unauthenticated_user_cannot_access_admin_tasks(
        self, client
    ):
        resp = await client.get("/api/admin/tasks")
        assert resp.status_code == 401

    async def test_student_cannot_update_task(
        self, client, student, db_session
    ):
        _, token = student
        task = await make_task(db_session, task_type=1, text="Test task")

        payload = {"text": "Hacked task", "answer": "123"}
        resp = await client.put(
            f"/api/admin/tasks/{task.id}",
            json=payload,
            headers=auth_headers(token),
        )

        assert resp.status_code == 403
