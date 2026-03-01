from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
import pytest

from backend.auth import ALGORITHM, SECRET_KEY, create_access_token
from backend.tests.conftest import auth_headers, fake

pytestmark = pytest.mark.asyncio


class TestGetMe:
    async def test_me_returns_user_info(self, client, student):
        user, token = student
        resp = await client.get("/api/auth/me", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == user.id
        assert data["username"] == user.username
        assert data["email"] == user.email
        assert data["role"] == "student"

    async def test_me_without_token(self, client):
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401

    async def test_me_with_deleted_user_token(self, client):
        token = create_access_token({"sub": 999999})
        resp = await client.get("/api/auth/me", headers=auth_headers(token))
        assert resp.status_code == 401

    async def test_me_token_without_sub(self, client):
        payload = {
            "exp": datetime.now(timezone.utc) + timedelta(days=1),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        resp = await client.get("/api/auth/me", headers=auth_headers(token))
        assert resp.status_code == 401


class TestLoginEdgeCases:
    async def test_login_nonexistent_user(self, client):
        resp = await client.post(
            "/api/auth/login",
            json={
                "username": "nonexistent_user_xyz_12345",
                "password": "anything",
            },
        )
        assert resp.status_code == 401

    async def test_login_empty_password(self, client):
        resp = await client.post(
            "/api/auth/login",
            json={"username": "user", "password": ""},
        )
        assert resp.status_code == 401

    async def test_register_and_get_me(self, client):
        username = fake.unique.user_name()[:40]
        reg_resp = await client.post(
            "/api/auth/register",
            json={
                "username": username,
                "email": fake.unique.email(),
                "password": "TestPass123!",
            },
        )
        assert reg_resp.status_code == 200
        token = reg_resp.json()["access_token"]

        me_resp = await client.get("/api/auth/me", headers=auth_headers(token))
        assert me_resp.status_code == 200
        assert me_resp.json()["username"] == username
        assert me_resp.json()["role"] == "student"


class TestTokenFormat:
    async def test_bearer_prefix_required(self, client, student):
        _, token = student
        resp = await client.get(
            "/api/auth/me",
            headers={"Authorization": token},
        )
        assert resp.status_code == 401

    async def test_random_string_token(self, client):
        resp = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer aaabbbccc"},
        )
        assert resp.status_code == 401

    async def test_wrong_secret_key_token(self, client, student):
        user, _ = student
        payload = {
            "sub": str(user.id),
            "exp": datetime.now(timezone.utc) + timedelta(days=1),
        }
        token = jwt.encode(payload, "wrong-secret", algorithm=ALGORITHM)
        resp = await client.get("/api/auth/me", headers=auth_headers(token))
        assert resp.status_code == 401
