from __future__ import annotations

import pytest

from backend.tests.conftest import _make_user, auth_headers, make_task

pytestmark = pytest.mark.asyncio


class TestAdminUsers:
    async def test_admin_can_list_users(self, client, admin):
        _, token = admin
        resp = await client.get(
            "/api/admin/users", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        users = resp.json()
        assert isinstance(users, list)
        assert len(users) >= 1
        assert "username" in users[0]
        assert "email" in users[0]

    async def test_teacher_cannot_list_users(self, client, teacher):
        _, token = teacher
        resp = await client.get(
            "/api/admin/users", headers=auth_headers(token)
        )
        assert resp.status_code == 403


class TestAdminSetRole:
    async def test_set_valid_role(self, client, admin, db_session):
        _, admin_token = admin
        user, _ = await _make_user(db_session, role="student")

        resp = await client.put(
            f"/api/admin/users/{user.id}/role",
            params={"role": "teacher"},
            headers=auth_headers(admin_token),
        )
        assert resp.status_code == 200

    async def test_set_invalid_role(self, client, admin, db_session):
        _, admin_token = admin
        user, _ = await _make_user(db_session, role="student")

        resp = await client.put(
            f"/api/admin/users/{user.id}/role",
            params={"role": "superadmin"},
            headers=auth_headers(admin_token),
        )
        assert resp.status_code == 400

    async def test_set_role_nonexistent_user(self, client, admin):
        _, token = admin
        resp = await client.put(
            "/api/admin/users/999999/role",
            params={"role": "teacher"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_student_cannot_set_role(self, client, student, db_session):
        _, student_token = student
        user, _ = await _make_user(db_session)

        resp = await client.put(
            f"/api/admin/users/{user.id}/role",
            params={"role": "admin"},
            headers=auth_headers(student_token),
        )
        assert resp.status_code == 403


class TestAdminStats:
    async def test_admin_stats_structure(self, client, admin, db_session):
        await make_task(db_session, task_type=1)
        _, token = admin

        resp = await client.get(
            "/api/admin/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "total_tasks" in data
        assert "total_users" in data
        assert "tasks_by_type" in data
        assert isinstance(data["tasks_by_type"], dict)
        assert data["total_tasks"] >= 1
        assert data["total_users"] >= 1

    async def test_student_cannot_view_admin_stats(self, client, student):
        _, token = student
        resp = await client.get(
            "/api/admin/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 403

    async def test_teacher_cannot_view_admin_stats(self, client, teacher):
        _, token = teacher
        resp = await client.get(
            "/api/admin/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 403


class TestAdminUpdateTask:
    async def test_partial_update_only_hint(self, client, admin, db_session):
        _, token = admin
        task = await make_task(db_session)
        original_text = task.text

        resp = await client.put(
            f"/api/admin/tasks/{task.id}",
            json={"hint": "Подсказка"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["hint"] == "Подсказка"
        assert data["text"] == original_text

    async def test_teacher_cannot_update_task(
        self, client, teacher, db_session
    ):
        _, token = teacher
        task = await make_task(db_session)
        resp = await client.put(
            f"/api/admin/tasks/{task.id}",
            json={"text": "hack"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 403
