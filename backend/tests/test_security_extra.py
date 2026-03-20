from __future__ import annotations

import pytest

from backend.tests.conftest import auth_headers, make_task

pytestmark = pytest.mark.asyncio


class TestSecurityExtra:
    async def test_sqli_search(self, client):
        resp = await client.get(
            "/api/tasks", params={"search": "'; DROP TABLE users; --"}
        )
        assert resp.status_code == 200
        assert isinstance(resp.json()["tasks"], list)

    async def test_sqli_auth(self, client):
        resp = await client.post(
            "/api/auth/token",
            data={"username": "admin' OR '1'='1", "password": "password"},
        )
        assert resp.status_code in (400, 401, 404, 422)

    async def test_xss_in_answer(self, client, student, db_session):
        _, token = student
        task = await make_task(db_session, task_type=1, text="XSS test")

        xss_payload = "<script>alert('hacked')</script>"

        resp = await client.post(
            "/api/solutions",
            json={"task_id": task.id, "answer": xss_payload, "content": []},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200

        sol_resp = await client.get(
            f"/api/solutions/task/{task.id}", headers=auth_headers(token)
        )
        solutions = sol_resp.json()
        assert len(solutions) > 0
        assert solutions[0]["answer"] == xss_payload

    async def test_xss_in_search(self, client):
        resp = await client.get(
            "/api/tasks", params={"search": "<img src=x onerror=alert(1)>"}
        )
        assert resp.status_code == 200
        assert isinstance(resp.json()["tasks"], list)
