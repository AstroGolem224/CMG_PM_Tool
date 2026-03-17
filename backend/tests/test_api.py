from __future__ import annotations

from datetime import datetime, timedelta, timezone


def _create_project(client, name="Test Project"):
    response = client.post(
        "/api/projects",
        json={"name": name, "description": "test", "color": "#3b82f6"},
    )
    assert response.status_code == 201
    return response.json()


def _create_label(client, project_id, name="backend"):
    response = client.post(
        "/api/labels",
        json={"project_id": project_id, "name": name, "color": "#06b6d4"},
    )
    assert response.status_code == 201
    return response.json()


def _create_view(
    client,
    project_id,
    name="Focus View",
    label_ids=None,
    priorities=None,
    completion="all",
    is_pinned=False,
    is_default=False,
):
    response = client.post(
        f"/api/projects/{project_id}/views",
        json={
            "name": name,
            "is_pinned": is_pinned,
            "is_default": is_default,
            "label_ids": label_ids or [],
            "priorities": priorities or [],
            "completion": completion,
        },
    )
    assert response.status_code == 201
    return response.json()


def _update_label(client, label_id, name="backend-updated"):
    response = client.put(
        f"/api/labels/{label_id}",
        json={"name": name, "color": "#14b8a6"},
    )
    assert response.status_code == 200
    return response.json()


def _create_task(
    client,
    project_id,
    column_id,
    title="Build API",
    deadline=None,
    priority="high",
    **extra,
):
    response = client.post(
        "/api/tasks",
        json={
            "project_id": project_id,
            "column_id": column_id,
            "title": title,
            "description": "task description",
            "priority": priority,
            "deadline": deadline,
            **extra,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_project_crud_and_default_columns(client):
    project = _create_project(client)
    project_detail = client.get(f"/api/projects/{project['id']}").json()
    column_names = [column["name"] for column in project_detail["columns"]]
    assert column_names == ["Backlog", "In Progress", "Review", "Done"]
    assert [column["kind"] for column in project_detail["columns"]] == [
        "backlog",
        "in_progress",
        "review",
        "done",
    ]

    update_response = client.put(
        f"/api/projects/{project['id']}",
        json={"name": "Renamed Project", "color": "#ef4444"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Renamed Project"

    archive_response = client.patch(f"/api/projects/{project['id']}/archive")
    assert archive_response.status_code == 200
    assert archive_response.json()["status"] == "archived"

    restore_response = client.patch(f"/api/projects/{project['id']}/restore")
    assert restore_response.status_code == 200
    assert restore_response.json()["status"] == "active"


def test_column_management(client):
    project = _create_project(client)
    project_detail = client.get(f"/api/projects/{project['id']}").json()
    columns = project_detail["columns"]

    create_response = client.post(
        f"/api/projects/{project['id']}/columns",
        json={"name": "Blocked", "color": "#ef4444"},
    )
    assert create_response.status_code == 201
    new_column = create_response.json()

    rename_response = client.put(
        f"/api/projects/{project['id']}/columns/{new_column['id']}",
        json={"name": "Ready for QA"},
    )
    assert rename_response.status_code == 200
    assert rename_response.json()["name"] == "Ready for QA"

    done_column = next(column for column in columns if column["kind"] == "done")
    kind_response = client.put(
        f"/api/projects/{project['id']}/columns/{new_column['id']}",
        json={"kind": "done"},
    )
    assert kind_response.status_code == 200
    assert kind_response.json()["kind"] == "done"

    demoted_done = client.get(f"/api/projects/{project['id']}/columns").json()
    assert next(column for column in demoted_done if column["id"] == done_column["id"])["kind"] == "custom"

    reorder_response = client.patch(
        f"/api/projects/{project['id']}/columns/reorder",
        json={"column_ids": [new_column["id"], *(column["id"] for column in columns)]},
    )
    assert reorder_response.status_code == 204

    ordered_columns = client.get(f"/api/projects/{project['id']}/columns").json()
    assert ordered_columns[0]["id"] == new_column["id"]

    delete_done_response = client.delete(f"/api/projects/{project['id']}/columns/{new_column['id']}")
    assert delete_done_response.status_code == 400

    revert_kind_response = client.put(
        f"/api/projects/{project['id']}/columns/{done_column['id']}",
        json={"kind": "done"},
    )
    assert revert_kind_response.status_code == 200

    delete_response = client.delete(f"/api/projects/{project['id']}/columns/{new_column['id']}")
    assert delete_response.status_code == 204


def test_task_move_labels_comments_and_dashboard(client):
    project = _create_project(client)
    project_detail = client.get(f"/api/projects/{project['id']}").json()
    columns = {column["name"]: column for column in project_detail["columns"]}

    task = _create_task(
        client,
        project["id"],
        columns["Backlog"]["id"],
        deadline=(datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
    )
    label = _create_label(client, project["id"])
    updated_label = _update_label(client, label["id"])
    assert updated_label["name"] == "backend-updated"

    assign_response = client.post(f"/api/tasks/{task['id']}/labels/{label['id']}")
    assert assign_response.status_code == 204

    comment_response = client.post(
        "/api/comments",
        json={"task_id": task["id"], "content": "first comment"},
    )
    assert comment_response.status_code == 201

    detail_response = client.get(f"/api/tasks/{task['id']}")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["labels"][0]["id"] == label["id"]
    assert detail["comments"][0]["content"] == "first comment"

    move_response = client.patch(
        f"/api/tasks/{task['id']}/move",
        json={"column_id": columns["Done"]["id"], "position": 0},
    )
    assert move_response.status_code == 200
    assert move_response.json()["column_id"] == columns["Done"]["id"]

    stats = client.get("/api/dashboard").json()
    assert stats["total_tasks"] == 1
    assert stats["completed"] == 1

    activity = client.get("/api/dashboard/activity").json()
    assert len(activity) >= 4

    delete_label_response = client.delete(f"/api/labels/{label['id']}")
    assert delete_label_response.status_code == 204


def test_recurring_task_move_spawns_clone_and_preserves_weekdays(client):
    project = _create_project(client, name="Recurring Project")
    project_detail = client.get(f"/api/projects/{project['id']}").json()
    columns = {column["name"]: column for column in project_detail["columns"]}

    recurring_task = _create_task(
        client,
        project["id"],
        columns["Backlog"]["id"],
        title="Weekly Standup",
        priority="medium",
        recurrence_type="weekly",
        recurrence_interval=1,
        recurrence_days="2,4",
    )

    move_response = client.patch(
        f"/api/tasks/{recurring_task['id']}/move",
        json={"column_id": columns["Done"]["id"], "position": 0},
    )
    assert move_response.status_code == 200
    assert move_response.json()["title"].startswith("✅ ")

    tasks = client.get(f"/api/projects/{project['id']}/tasks").json()
    assert len(tasks) == 2

    backlog_clone = next(task for task in tasks if task["column_id"] == columns["Backlog"]["id"])
    assert backlog_clone["title"] == "Weekly Standup"
    assert backlog_clone["recurrence_type"] == "weekly"
    assert backlog_clone["recurrence_days"] == "2,4"
    assert backlog_clone["deadline"] is not None
    assert datetime.fromisoformat(backlog_clone["deadline"]).isoweekday() in {2, 4}


def test_project_delete_cascades(client):
    project = _create_project(client)
    project_detail = client.get(f"/api/projects/{project['id']}").json()
    columns = project_detail["columns"]
    task = _create_task(client, project["id"], columns[0]["id"])
    client.post("/api/comments", json={"task_id": task["id"], "content": "to be deleted"})

    delete_response = client.delete(f"/api/projects/{project['id']}")
    assert delete_response.status_code == 204

    missing_project = client.get(f"/api/projects/{project['id']}")
    assert missing_project.status_code == 404


def test_dashboard_filters_by_labels(client):
    project = _create_project(client, name="Filter Project")
    project_detail = client.get(f"/api/projects/{project['id']}").json()
    columns = {column["name"]: column for column in project_detail["columns"]}

    labeled_task = _create_task(client, project["id"], columns["Backlog"]["id"], title="Tagged Task")
    other_task = _create_task(client, project["id"], columns["Review"]["id"], title="Other Task")
    label = _create_label(client, project["id"], name="focus")

    assign_response = client.post(f"/api/tasks/{labeled_task['id']}/labels/{label['id']}")
    assert assign_response.status_code == 204

    labels_response = client.get("/api/dashboard/labels")
    assert labels_response.status_code == 200
    assert any(item["id"] == label["id"] for item in labels_response.json())

    filtered_stats = client.get(f"/api/dashboard?label_ids={label['id']}")
    assert filtered_stats.status_code == 200
    assert filtered_stats.json()["total_tasks"] == 1

    filtered_deadlines = client.get(f"/api/dashboard/deadlines?label_ids={label['id']}")
    assert filtered_deadlines.status_code == 200
    assert filtered_deadlines.json() == []

    filtered_activity = client.get(f"/api/dashboard/activity?label_ids={label['id']}")
    assert filtered_activity.status_code == 200
    assert all(item["task_title"] == "Tagged Task" for item in filtered_activity.json())
    assert other_task["title"] not in [item["task_title"] for item in filtered_activity.json()]


def test_dashboard_filters_by_label_priority_and_completion(client):
    project = _create_project(client, name="Combined Filter Project")
    project_detail = client.get(f"/api/projects/{project['id']}").json()
    columns = {column["name"]: column for column in project_detail["columns"]}

    done_task = _create_task(
        client,
        project["id"],
        columns["Done"]["id"],
        title="Done Focus Task",
        priority="urgent",
    )
    open_task = _create_task(
        client,
        project["id"],
        columns["Backlog"]["id"],
        title="Open Focus Task",
        priority="urgent",
        deadline=(datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
    )
    low_task = _create_task(
        client,
        project["id"],
        columns["Backlog"]["id"],
        title="Low Noise Task",
        priority="low",
    )
    label = _create_label(client, project["id"], name="focus")

    assert client.post(f"/api/tasks/{done_task['id']}/labels/{label['id']}").status_code == 204
    assert client.post(f"/api/tasks/{open_task['id']}/labels/{label['id']}").status_code == 204
    assert client.post("/api/comments", json={"task_id": done_task["id"], "content": "done"}).status_code == 201
    assert client.post("/api/comments", json={"task_id": open_task["id"], "content": "open"}).status_code == 201

    query = f"label_ids={label['id']}&priorities=urgent&completion=done"

    filtered_stats = client.get(f"/api/dashboard?{query}")
    assert filtered_stats.status_code == 200
    assert filtered_stats.json() == {
        "total_tasks": 1,
        "in_progress": 0,
        "completed": 1,
        "overdue": 0,
    }

    filtered_deadlines = client.get(f"/api/dashboard/deadlines?{query}")
    assert filtered_deadlines.status_code == 200
    assert filtered_deadlines.json() == []

    filtered_activity = client.get(f"/api/dashboard/activity?{query}")
    assert filtered_activity.status_code == 200
    assert all(item["task_title"] == "Done Focus Task" for item in filtered_activity.json())
    assert low_task["title"] not in [item["task_title"] for item in filtered_activity.json()]


def test_project_views_roundtrip(client):
    project = _create_project(client, name="Views Project")
    first_view = _create_view(
        client,
        project["id"],
        name="Done Focus",
        label_ids=["label-1"],
        priorities=["urgent"],
        completion="done",
    )
    second_view = _create_view(client, project["id"], name="Open Queue", completion="open", is_pinned=True)

    assert first_view["is_default"] is True
    assert first_view["is_pinned"] is True
    assert second_view["is_default"] is False
    assert second_view["is_pinned"] is True

    list_response = client.get(f"/api/projects/{project['id']}/views")
    assert list_response.status_code == 200
    views = list_response.json()
    assert [view["name"] for view in views] == ["Done Focus", "Open Queue"]
    assert next(view for view in views if view["id"] == first_view["id"])["priorities"] == ["urgent"]

    overwrite_response = client.put(
        f"/api/projects/{project['id']}/views/{first_view['id']}",
        json={
            "name": "Focus Done",
            "priorities": ["high"],
            "completion": "done",
            "is_default": False,
            "is_pinned": False,
        },
    )
    assert overwrite_response.status_code == 200
    assert overwrite_response.json()["name"] == "Focus Done"
    assert overwrite_response.json()["priorities"] == ["high"]
    assert overwrite_response.json()["is_default"] is False
    assert overwrite_response.json()["is_pinned"] is False

    promote_second_response = client.put(
        f"/api/projects/{project['id']}/views/{second_view['id']}",
        json={"is_default": True},
    )
    assert promote_second_response.status_code == 200
    assert promote_second_response.json()["is_default"] is True
    assert promote_second_response.json()["is_pinned"] is True

    ordered_after_update = client.get(f"/api/projects/{project['id']}/views").json()
    assert [view["name"] for view in ordered_after_update] == ["Open Queue", "Focus Done"]

    reorder_response = client.patch(
        f"/api/projects/{project['id']}/views/reorder",
        json={"is_pinned": True, "view_ids": [second_view["id"]]},
    )
    assert reorder_response.status_code == 204

    delete_response = client.delete(f"/api/projects/{project['id']}/views/{second_view['id']}")
    assert delete_response.status_code == 204
    remaining = client.get(f"/api/projects/{project['id']}/views").json()
    assert [view["id"] for view in remaining] == [first_view["id"]]


def test_bulk_task_actions(client):
    project = _create_project(client, name="Bulk Project")
    project_detail = client.get(f"/api/projects/{project['id']}").json()
    columns = {column["name"]: column for column in project_detail["columns"]}

    first_task = _create_task(client, project["id"], columns["Backlog"]["id"], title="Bulk One", priority="medium")
    second_task = _create_task(client, project["id"], columns["Backlog"]["id"], title="Bulk Two", priority="low")

    move_response = client.post(
        f"/api/projects/{project['id']}/tasks/bulk",
        json={
            "task_ids": [first_task["id"], second_task["id"]],
            "operation": "move",
            "column_id": columns["Review"]["id"],
        },
    )
    assert move_response.status_code == 200
    assert move_response.json()["updated"] == 2

    priority_response = client.post(
        f"/api/projects/{project['id']}/tasks/bulk",
        json={
            "task_ids": [first_task["id"], second_task["id"]],
            "operation": "priority",
            "priority": "urgent",
        },
    )
    assert priority_response.status_code == 200
    assert priority_response.json()["updated"] == 2

    tasks = client.get(f"/api/projects/{project['id']}/tasks").json()
    assert all(task["column_id"] == columns["Review"]["id"] for task in tasks)
    assert all(task["priority"] == "urgent" for task in tasks)

    delete_response = client.post(
        f"/api/projects/{project['id']}/tasks/bulk",
        json={
            "task_ids": [first_task["id"], second_task["id"]],
            "operation": "delete",
        },
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["updated"] == 2
    assert client.get(f"/api/projects/{project['id']}/tasks").json() == []
