from __future__ import annotations

import pytest

from backend.tests.conftest import auth_headers, make_task

pytestmark = pytest.mark.asyncio


class TestFunctionality:
    async def test_pagination_extreme_values(self, client):
        resp = await client.get(
            "/api/tasks", params={"page": 999999, "per_page": 50}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["tasks"] == []
        assert data["page"] == 999999

    async def test_pagination_negative_values(self, client):
        resp = await client.get(
            "/api/tasks", params={"page": -1, "per_page": -5}
        )
        assert resp.status_code == 422

    async def test_invalid_task_type(self, client):
        resp = await client.get(
            "/api/tasks", params={"task_type": "not_a_number"}
        )
        assert resp.status_code == 422

    async def test_huge_payload_rejection(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session, task_type=1, text="Size limit test")

        huge_string = "A" * 1000000

        # Правильный URL и тело запроса
        resp = await client.post(
            "/api/solutions",
            json={"task_id": task.id, "answer": huge_string, "content": []},
            headers=auth_headers(token),
        )
        assert resp.status_code == 422
