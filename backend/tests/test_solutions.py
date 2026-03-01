from __future__ import annotations

import io

from PIL import Image
import pytest

from backend.tests.conftest import auth_headers, make_task

pytestmark = pytest.mark.asyncio


class TestAnswerNormalization:
    async def test_comma_normalized_to_dot(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session, answer="0.5")

        resp = await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "0,5"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["correct"] is True

    async def test_case_insensitive(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session, answer="ABC")

        resp = await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "abc"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["correct"] is True

    async def test_whitespace_trimmed(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session, answer="42")

        resp = await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "  42  "},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["correct"] is True

    async def test_wrong_answer(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session, answer="7")

        resp = await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "99"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["correct"] is False
        assert body["correct_answer"] == "7"


class TestFileUpload:
    @staticmethod
    def _make_image_bytes(
        fmt: str = "JPEG", size: tuple[int, int] = (100, 100)
    ) -> bytes:
        img = Image.new("RGB", size, color="red")
        buf = io.BytesIO()
        img.save(buf, format=fmt)
        return buf.getvalue()

    async def test_upload_valid_image(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session)

        sol_resp = await client.post(
            "/api/solutions",
            json={"task_id": task.id, "answer": "test"},
            headers=auth_headers(token),
        )
        sol_id = sol_resp.json()["id"]

        img_bytes = self._make_image_bytes()
        resp = await client.post(
            f"/api/solutions/upload/{sol_id}",
            files={"file": ("photo.jpg", img_bytes, "image/jpeg")},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "filename" in data

    async def test_upload_png_image(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session)
        sol_resp = await client.post(
            "/api/solutions",
            json={"task_id": task.id},
            headers=auth_headers(token),
        )
        sol_id = sol_resp.json()["id"]

        img_bytes = self._make_image_bytes(fmt="PNG")
        resp = await client.post(
            f"/api/solutions/upload/{sol_id}",
            files={"file": ("scan.png", img_bytes, "image/png")},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200


class TestStats:
    async def test_correct_answer_increments_stats(
        self, client, student, db_session
    ):
        _, token = student

        task = await make_task(db_session, answer="10")

        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "10"},
            headers=auth_headers(token),
        )

        resp = await client.get(
            "/api/profile/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200
        stats = resp.json()
        assert stats["tasks_solved"] >= 1
        assert stats["streak_current"] >= 1
        assert stats["correct_attempts"] >= 1

    async def test_wrong_answer_resets_streak(
        self, client, student, db_session
    ):
        _, token = student
        task = await make_task(db_session, answer="5")

        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "5"},
            headers=auth_headers(token),
        )
        task2 = await make_task(db_session, answer="99")
        await client.post(
            "/api/solutions/check",
            json={"task_id": task2.id, "answer": "0"},
            headers=auth_headers(token),
        )

        resp = await client.get(
            "/api/profile/stats", headers=auth_headers(token)
        )
        assert resp.json()["streak_current"] == 0

    async def test_duplicate_correct_does_not_double_tasks_solved(
        self, client, student, db_session
    ):
        _, token = student
        task = await make_task(db_session, answer="7")

        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "7"},
            headers=auth_headers(token),
        )
        resp1 = await client.get(
            "/api/profile/stats", headers=auth_headers(token)
        )
        solved_after_first = resp1.json()["tasks_solved"]

        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "7"},
            headers=auth_headers(token),
        )
        resp2 = await client.get(
            "/api/profile/stats", headers=auth_headers(token)
        )
        assert resp2.json()["tasks_solved"] == solved_after_first
