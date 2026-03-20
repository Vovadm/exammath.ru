from __future__ import annotations

import pytest

from backend.tests.conftest import auth_headers, make_task

pytestmark = pytest.mark.asyncio


class TestRatingSecurity:
    async def test_unauthenticated_user_cannot_vote(self, client, db_session):
        task = await make_task(db_session, task_type=1, text="Test task")

        resp = await client.post(
            f"/api/tasks/{task.id}/vote", json={"vote": "like"}
        )
        assert resp.status_code == 401

    async def test_user_cannot_double_vote(self, client, db_session, student):
        _, token = student
        task = await make_task(db_session, task_type=1, text="Test task")
        headers = auth_headers(token)

        resp1 = await client.post(
            f"/api/tasks/{task.id}/vote",
            json={"vote": "like"},
            headers=headers,
        )
        assert resp1.status_code == 200
        assert resp1.json()["likes"] == 1
        assert resp1.json()["dislikes"] == 0

        resp2 = await client.post(
            f"/api/tasks/{task.id}/vote",
            json={"vote": "like"},
            headers=headers,
        )
        assert resp2.status_code == 200
        assert resp2.json()["likes"] == 1
        assert resp2.json()["dislikes"] == 0

        resp3 = await client.post(
            f"/api/tasks/{task.id}/vote",
            json={"vote": "dislike"},
            headers=headers,
        )
        assert resp3.status_code == 200
        assert resp3.json()["likes"] == 0
        assert resp3.json()["dislikes"] == 1
