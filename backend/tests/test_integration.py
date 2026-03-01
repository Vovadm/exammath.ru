from __future__ import annotations

import pytest

from backend.tests.conftest import auth_headers, fake, make_task

pytestmark = pytest.mark.asyncio


class TestStudentFlow:
    async def test_full_student_cycle(self, client, db_session):
        username = fake.unique.user_name()[:40]
        reg_resp = await client.post(
            "/api/auth/register",
            json={
                "username": username,
                "email": fake.unique.email(),
                "password": "StudentPass1",
            },
        )
        assert reg_resp.status_code == 200
        token = reg_resp.json()["access_token"]
        headers = auth_headers(token)

        me_resp = await client.get("/api/auth/me", headers=headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["username"] == username
        assert me_resp.json()["role"] == "student"

        task = await make_task(db_session, answer="25", task_type=3)
        tasks_resp = await client.get("/api/tasks", params={"task_type": 3})
        assert tasks_resp.status_code == 200
        assert tasks_resp.json()["total"] >= 1

        check_resp = await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "25"},
            headers=headers,
        )
        assert check_resp.status_code == 200
        assert check_resp.json()["correct"] is True

        stats_resp = await client.get("/api/profile/stats", headers=headers)
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        assert stats["tasks_solved"] >= 1
        assert stats["correct_attempts"] >= 1
        assert stats["streak_current"] >= 1


class TestTeacherFlow:
    async def test_teacher_variant_and_review(
        self, client, teacher, student, admin, db_session
    ):
        teacher_user, teacher_token = teacher
        student_user, student_token = student
        _, admin_token = admin

        t1 = await make_task(db_session, task_type=1, answer="10")
        t2 = await make_task(db_session, task_type=5, answer="20")

        variant_resp = await client.post(
            "/api/variants",
            json={
                "title": "Контрольная #1",
                "task_ids": [t1.id, t2.id],
            },
            headers=auth_headers(teacher_token),
        )
        assert variant_resp.status_code == 200
        variant = variant_resp.json()
        assert len(variant["tasks"]) == 2

        await client.post(
            "/api/solutions/check",
            json={"task_id": t1.id, "answer": "10"},
            headers=auth_headers(student_token),
        )

        sol_resp = await client.get(
            f"/api/solutions/task/{t1.id}/all",
            headers=auth_headers(teacher_token),
        )
        assert sol_resp.status_code == 200
        solutions = sol_resp.json()
        assert len(solutions) >= 1
        assert any(s["user_id"] == student_user.id for s in solutions)


class TestAdminFlow:

    async def test_admin_class_management(
        self, client, admin, student, db_session
    ):
        admin_user, admin_token = admin
        student_user, student_token = student

        class_resp = await client.post(
            "/api/classes",
            json={"name": "9А", "description": "Подготовка к ОГЭ"},
            headers=auth_headers(admin_token),
        )
        assert class_resp.status_code == 200
        class_id = class_resp.json()["id"]

        add_resp = await client.post(
            f"/api/classes/{class_id}/members",
            json={"user_id": student_user.id, "role": "student"},
            headers=auth_headers(admin_token),
        )
        assert add_resp.status_code == 200

        classes_resp = await client.get(
            "/api/classes", headers=auth_headers(student_token)
        )
        assert class_resp.status_code == 200
        class_ids = [c["id"] for c in classes_resp.json()]
        assert class_id in class_ids

        task = await make_task(db_session, answer="3")
        await client.post(
            "/api/solutions/check",
            json={"task_id": task.id, "answer": "3"},
            headers=auth_headers(student_token),
        )

        stats_resp = await client.get(
            f"/api/profile/user/{student_user.id}/stats"
        )
        assert stats_resp.status_code == 200
        assert stats_resp.json()["tasks_solved"] >= 1

        del_resp = await client.delete(
            f"/api/classes/{class_id}/members/{student_user.id}",
            headers=auth_headers(admin_token),
        )
        assert del_resp.status_code == 200

        classes_resp2 = await client.get(
            "/api/classes", headers=auth_headers(student_token)
        )
        class_ids2 = [c["id"] for c in classes_resp2.json()]
        assert class_id not in class_ids2
