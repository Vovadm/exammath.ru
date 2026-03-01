from __future__ import annotations

import pytest

from backend.tests.conftest import auth_headers

pytestmark = pytest.mark.asyncio


class TestClassLifecycle:
    async def test_admin_creates_class(self, client, admin):
        _, token = admin
        resp = await client.post(
            "/api/classes",
            json={"name": "10Б", "description": "Математический"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "10Б"
        assert data["description"] == "Математический"

    async def test_student_cannot_create_class(self, client, student):
        _, token = student
        resp = await client.post(
            "/api/classes",
            json={"name": "Hack"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 403


class TestClassMembers:
    async def test_add_student_to_class(self, client, admin, student):
        admin_user, admin_token = admin
        student_user, _ = student

        create_resp = await client.post(
            "/api/classes",
            json={"name": "11В"},
            headers=auth_headers(admin_token),
        )
        class_id = create_resp.json()["id"]

        resp = await client.post(
            f"/api/classes/{class_id}/members",
            json={"user_id": student_user.id, "role": "student"},
            headers=auth_headers(admin_token),
        )
        assert resp.status_code == 200
        assert resp.json()["user_id"] == student_user.id

    async def test_duplicate_member_rejected(self, client, admin, student):
        _, admin_token = admin
        student_user, _ = student

        create_resp = await client.post(
            "/api/classes",
            json={"name": "DupClass"},
            headers=auth_headers(admin_token),
        )
        class_id = create_resp.json()["id"]

        await client.post(
            f"/api/classes/{class_id}/members",
            json={"user_id": student_user.id},
            headers=auth_headers(admin_token),
        )
        resp2 = await client.post(
            f"/api/classes/{class_id}/members",
            json={"user_id": student_user.id},
            headers=auth_headers(admin_token),
        )
        assert resp2.status_code == 400

    async def test_remove_member(self, client, admin, student):
        _, admin_token = admin
        student_user, _ = student

        create_resp = await client.post(
            "/api/classes",
            json={"name": "RemoveTest"},
            headers=auth_headers(admin_token),
        )
        class_id = create_resp.json()["id"]

        await client.post(
            f"/api/classes/{class_id}/members",
            json={"user_id": student_user.id},
            headers=auth_headers(admin_token),
        )

        resp = await client.delete(
            f"/api/classes/{class_id}/members/{student_user.id}",
            headers=auth_headers(admin_token),
        )
        assert resp.status_code == 200

    async def test_class_list_filtered_by_role(self, client, admin, student):
        _, admin_token = admin
        student_user, student_token = student

        resp = await client.get(
            "/api/classes", headers=auth_headers(student_token)
        )
        assert resp.status_code == 200
        class_names = [c["name"] for c in resp.json()]
        assert "OnlyAdmin" not in class_names


class TestDeleteClass:
    async def test_delete_class(self, client, admin):
        _, token = admin
        create_resp = await client.post(
            "/api/classes",
            json={"name": "ToDelete"},
            headers=auth_headers(token),
        )
        class_id = create_resp.json()["id"]

        resp = await client.delete(
            f"/api/classes/{class_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200

        get_resp = await client.get(
            f"/api/classes/{class_id}",
            headers=auth_headers(token),
        )
        assert get_resp.status_code == 404
