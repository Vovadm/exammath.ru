from __future__ import annotations

import pytest

from backend.tests.conftest import _make_user, auth_headers, make_task

pytestmark = pytest.mark.asyncio


class TestSaveSolution:
    async def test_save_new_solution(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session)
        resp = await client.post(
            "/api/solutions",
            json={
                "task_id": task.id,
                "answer": "my answer",
                "content": [{"type": "text", "value": "step 1"}],
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["task_id"] == task.id
        assert data["answer"] == "my answer"
        assert data["is_correct"] is None
        assert len(data["content"]) == 1

    async def test_save_solution_updates_existing_draft(
        self, client, student, db_session
    ):
        _, token = student
        headers = auth_headers(token)
        task = await make_task(db_session)

        resp1 = await client.post(
            "/api/solutions",
            json={"task_id": task.id, "answer": "draft1"},
            headers=headers,
        )
        sol_id = resp1.json()["id"]

        resp2 = await client.post(
            "/api/solutions",
            json={
                "task_id": task.id,
                "answer": "draft2",
                "content": [{"type": "text", "value": "updated"}],
            },
            headers=headers,
        )
        assert resp2.status_code == 200
        assert resp2.json()["id"] == sol_id
        assert resp2.json()["answer"] == "draft2"

    async def test_save_solution_nonexistent_task(self, client, student):
        _, token = student
        resp = await client.post(
            "/api/solutions",
            json={"task_id": 999999, "answer": "?"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_anonymous_cannot_save_solution(self, client, db_session):
        task = await make_task(db_session)
        resp = await client.post(
            "/api/solutions",
            json={"task_id": task.id, "answer": "hack"},
        )
        assert resp.status_code == 401


class TestGetMySolutions:
    async def test_get_my_solutions_empty(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session)
        resp = await client.get(
            f"/api/solutions/task/{task.id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_get_my_solutions_after_check(
        self, client, student, db_session
    ):
        _, token = student
        headers = auth_headers(token)
        task = await make_task(db_session, answer="5")

        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "5"},
            headers=headers,
        )

        resp = await client.get(
            f"/api/solutions/task/{task.id}", headers=headers
        )
        assert resp.status_code == 200
        solutions = resp.json()
        assert len(solutions) >= 1
        assert solutions[0]["is_correct"] is True

    async def test_solutions_isolated_between_users(
        self, client, student, db_session
    ):
        user1, token1 = student
        user2, token2 = await _make_user(db_session)
        task = await make_task(db_session, answer="1")

        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "1"},
            headers=auth_headers(token1),
        )

        resp = await client.get(
            f"/api/solutions/task/{task.id}",
            headers=auth_headers(token2),
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 0


class TestGetAllSolutions:
    async def test_student_cannot_view_all_solutions(
        self, client, student, db_session
    ):
        _, token = student
        task = await make_task(db_session)
        resp = await client.get(
            f"/api/solutions/task/{task.id}/all",
            headers=auth_headers(token),
        )
        assert resp.status_code == 403

    async def test_admin_can_view_all_solutions(
        self, client, admin, student, db_session
    ):
        _, student_token = student
        _, admin_token = admin
        task = await make_task(db_session, answer="10")

        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "10"},
            headers=auth_headers(student_token),
        )

        resp = await client.get(
            f"/api/solutions/task/{task.id}/all",
            headers=auth_headers(admin_token),
        )
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


class TestCheckAnswer:
    async def test_check_nonexistent_task(self, client, student):
        _, token = student
        resp = await client.post(
            "/api/solutions/check",
            json={"task_id": 999999, "answer": "42"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    async def test_check_task_without_answer(
        self, client, student, db_session
    ):
        _, token = student
        task = await make_task(db_session, answer=None)
        resp = await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "anything"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["correct"] is False

    async def test_check_task_empty_answer(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session, answer="")
        resp = await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "something"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200


class TestUploadPermissions:
    async def test_upload_to_other_users_solution(
        self, client, student, db_session
    ):
        user1, token1 = student
        user2, token2 = await _make_user(db_session)
        task = await make_task(db_session)

        sol_resp = await client.post(
            "/api/solutions",
            json={"task_id": task.id, "answer": "test"},
            headers=auth_headers(token1),
        )
        sol_id = sol_resp.json()["id"]

        resp = await client.post(
            f"/api/solutions/upload/{sol_id}",
            files={"file": ("hack.jpg", b"\xff\xd8\xff", "image/jpeg")},
            headers=auth_headers(token2),
        )
        assert resp.status_code == 404

    async def test_upload_to_nonexistent_solution(self, client, student):
        _, token = student
        resp = await client.post(
            "/api/solutions/upload/999999",
            files={"file": ("test.jpg", b"\xff\xd8\xff", "image/jpeg")},
            headers=auth_headers(token),
        )
        assert resp.status_code == 404
