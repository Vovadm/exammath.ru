from __future__ import annotations

import pytest

from backend.tests.conftest import auth_headers, make_task

pytestmark = pytest.mark.asyncio


class TestMyStats:
    async def test_empty_stats_for_new_user(self, client, student):
        _, token = student
        resp = await client.get(
            "/api/profile/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_attempts"] == 0
        assert data["correct_attempts"] == 0
        assert data["tasks_solved"] == 0
        assert data["accuracy"] == 0.0
        assert data["streak_current"] == 0
        assert data["streak_max"] == 0

    async def test_accuracy_calculated(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session, answer="5")
        headers = auth_headers(token)

        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "5"},
            headers=headers,
        )
        task2 = await make_task(db_session, answer="10")
        await client.post(
            "/api/solutions/check",
            json={"task_id": task2.id, "answer": "wrong"},
            headers=headers,
        )

        resp = await client.get("/api/profile/stats", headers=headers)
        stats = resp.json()
        assert stats["total_attempts"] == 2
        assert stats["correct_attempts"] == 1
        assert stats["accuracy"] == 50.0

    async def test_stats_by_type_tracked(self, client, student, db_session):
        _, token = student
        headers = auth_headers(token)
        task = await make_task(db_session, answer="1", task_type=3)
        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "1"},
            headers=headers,
        )

        resp = await client.get("/api/profile/stats", headers=headers)
        by_type = resp.json()["stats_by_type"]
        assert "3" in by_type
        assert by_type["3"]["attempts"] >= 1
        assert by_type["3"]["correct"] >= 1


class TestMyHistory:
    async def test_empty_history(self, client, student):
        _, token = student
        resp = await client.get(
            "/api/profile/history", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_history_after_check(self, client, student, db_session):
        _, token = student
        headers = auth_headers(token)
        task = await make_task(db_session, answer="42")
        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "42"},
            headers=headers,
        )

        resp = await client.get("/api/profile/history", headers=headers)
        assert resp.status_code == 200
        history = resp.json()
        assert len(history) >= 1
        assert history[0]["task_id"] == task.id
        assert history[0]["is_correct"] is True

    async def test_history_ordered_desc(self, client, student, db_session):
        _, token = student
        headers = auth_headers(token)
        t1 = await make_task(db_session, answer="1")
        t2 = await make_task(db_session, answer="2")
        await client.post(
            "/api/solutions/check",
            json={"task_id": t1.id, "answer": "1"},
            headers=headers,
        )
        await client.post(
            "/api/solutions/check",
            json={"task_id": t2.id, "answer": "2"},
            headers=headers,
        )

        resp = await client.get("/api/profile/history", headers=headers)
        history = resp.json()
        assert len(history) >= 2
        assert history[0]["task_id"] == t2.id

    async def test_anonymous_cannot_view_history(self, client):
        resp = await client.get("/api/profile/history")
        assert resp.status_code == 401


class TestUserProfile:
    async def test_get_user_profile(self, client, student):
        user, _ = student
        resp = await client.get(f"/api/profile/user/{user.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == user.id
        assert data["username"] == user.username

    async def test_get_user_stats_by_id(self, client, student, db_session):
        user, token = student
        task = await make_task(db_session, answer="9")
        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "9"},
            headers=auth_headers(token),
        )

        resp = await client.get(f"/api/profile/user/{user.id}/stats")
        assert resp.status_code == 200
        assert resp.json()["tasks_solved"] >= 1

    async def test_user_stats_nonexistent(self, client):
        resp = await client.get("/api/profile/user/999999/stats")
        assert resp.status_code == 404


class TestUserHistory:
    async def test_student_can_view_own_history(
        self, client, student, db_session
    ):
        user, token = student
        task = await make_task(db_session, answer="3")
        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "3"},
            headers=auth_headers(token),
        )

        resp = await client.get(
            f"/api/profile/user/{user.id}/history",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    async def test_student_cannot_view_other_history(
        self, client, student, db_session
    ):
        _, token = student
        from backend.tests.conftest import _make_user

        other, _ = await _make_user(db_session)

        resp = await client.get(
            f"/api/profile/user/{other.id}/history",
            headers=auth_headers(token),
        )
        assert resp.status_code == 403

    async def test_teacher_can_view_any_history(
        self, client, teacher, student, db_session
    ):
        student_user, student_token = student
        _, teacher_token = teacher
        task = await make_task(db_session, answer="8")
        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "8"},
            headers=auth_headers(student_token),
        )

        resp = await client.get(
            f"/api/profile/user/{student_user.id}/history",
            headers=auth_headers(teacher_token),
        )
        assert resp.status_code == 200

    async def test_admin_can_view_any_history(
        self, client, admin, student, db_session
    ):
        student_user, _ = student
        _, admin_token = admin

        resp = await client.get(
            f"/api/profile/user/{student_user.id}/history",
            headers=auth_headers(admin_token),
        )
        assert resp.status_code == 200
