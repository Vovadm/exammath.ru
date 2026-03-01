from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
import pytest

from backend.auth import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    hash_password,
    verify_password,
)
from backend.tests.conftest import auth_headers, fake


class TestRegistration:
    @pytest.mark.asyncio
    async def test_register_success(self, client):
        resp = await client.post(
            "/api/auth/register",
            json={
                "username": fake.unique.user_name()[:40],
                "email": fake.unique.email(),
                "password": "SecurePass1!",
            },
        )
        if resp.status_code != 200:
            print(f"Response status: {resp.status_code}, body: {resp.text}")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, client):
        username = fake.unique.user_name()[:40]
        payload = {
            "username": username,
            "email": fake.unique.email(),
            "password": "Pass123!",
        }
        resp1 = await client.post("/api/auth/register", json=payload)
        assert resp1.status_code == 200

        payload["email"] = fake.unique.email()
        resp2 = await client.post("/api/auth/register", json=payload)
        assert resp2.status_code == 400
        assert "уже занято" in resp2.json()["detail"]

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client):
        email = fake.unique.email()
        resp1 = await client.post(
            "/api/auth/register",
            json={
                "username": fake.unique.user_name()[:40],
                "email": email,
                "password": "Pass123!",
            },
        )
        assert resp1.status_code == 200

        resp2 = await client.post(
            "/api/auth/register",
            json={
                "username": fake.unique.user_name()[:40],
                "email": email,
                "password": "Pass123!",
            },
        )
        assert resp2.status_code == 400
        assert "Email" in resp2.json()["detail"]


class TestJWT:
    def test_create_token_contains_sub(self):
        token = create_access_token({"sub": 42})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "42"

    def test_token_has_expiration(self):
        token = create_access_token({"sub": 1})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    @pytest.mark.asyncio
    async def test_expired_token_rejected(self, client):
        expired_payload = {
            "sub": "999",
            "exp": datetime.now(timezone.utc) - timedelta(days=1),
        }
        token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
        resp = await client.get("/api/auth/me", headers=auth_headers(token))
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_expired_token_rejected_async(self, client):
        expired_payload = {
            "sub": "999",
            "exp": datetime.now(timezone.utc) - timedelta(days=1),
        }
        token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
        resp = await client.get("/api/auth/me", headers=auth_headers(token))
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_token_rejected(self, client):
        resp = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert resp.status_code == 401


class TestRBAC:
    @pytest.mark.asyncio
    async def test_student_cannot_access_admin(self, client, student):
        _, token = student
        resp = await client.get(
            "/api/admin/users", headers=auth_headers(token)
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_anonymous_cannot_create_solution(self, client):
        resp = await client.post(
            "/api/solutions/check",
            json={"task_id": 1, "answer": "42"},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_student_cannot_create_class(self, client, student):
        _, token = student
        resp = await client.post(
            "/api/classes",
            json={"name": "10А"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_teacher_can_create_variant(
        self, client, teacher, db_session
    ):
        from backend.tests.conftest import make_task

        _, token = teacher
        task = await make_task(db_session)
        resp = await client.post(
            "/api/variants",
            json={"title": "Вариант 1", "task_ids": [task.id]},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_admin_can_access_admin_panel(self, client, admin):
        _, token = admin
        resp = await client.get(
            "/api/admin/stats", headers=auth_headers(token)
        )
        assert resp.status_code == 200


class TestPasswords:
    def test_hash_and_verify_password(self):
        plain = "MyS3cur3P@ss"
        hashed = hash_password(plain)
        assert hashed != plain
        assert verify_password(plain, hashed) is True
        assert verify_password("wrong", hashed) is False

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client):
        username = fake.unique.user_name()[:40]
        await client.post(
            "/api/auth/register",
            json={
                "username": username,
                "email": fake.unique.email(),
                "password": "Correct123",
            },
        )
        resp = await client.post(
            "/api/auth/login",
            json={"username": username, "password": "Wrong999"},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_login_success(self, client):
        username = fake.unique.user_name()[:40]
        await client.post(
            "/api/auth/register",
            json={
                "username": username,
                "email": fake.unique.email(),
                "password": "GoodPass1",
            },
        )
        resp = await client.post(
            "/api/auth/login",
            json={"username": username, "password": "GoodPass1"},
        )
        assert resp.status_code == 200
        assert "access_token" in resp.json()
