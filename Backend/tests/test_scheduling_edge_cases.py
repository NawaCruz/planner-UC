"""Tests para casos límite del solver usando monkeypatch sobre la data demo."""

from app import scheduling_demo
from app.scheduling_demo_data import build_demo_data


def test_solver_with_no_students_has_zero_total_demand(monkeypatch):
    data = build_demo_data()
    data["students"] = ()

    monkeypatch.setattr(scheduling_demo, "build_demo_data", lambda: data)

    solution = scheduling_demo.solve_student_timetable_demo_data()

    assert solution["success"] is True
    assert solution["summary"]["total_demand"] == 0
    assert all(course["demand"] == 0 for course in solution["course_capacity_summary"])


def test_solver_with_no_rooms_returns_not_feasible(monkeypatch):
    data = build_demo_data()
    data["rooms"] = ()

    monkeypatch.setattr(scheduling_demo, "build_demo_data", lambda: data)

    solution = scheduling_demo.solve_student_timetable_demo_data()

    assert solution["success"] is False
    assert "No se encontro una solucion factible" in solution["message"]


def test_solver_with_no_time_slots_returns_not_feasible(monkeypatch):
    data = build_demo_data()
    data["time_slots"] = ()
    data["patterns_by_blocks"] = {1: (), 2: (), 3: ()}

    monkeypatch.setattr(scheduling_demo, "build_demo_data", lambda: data)

    solution = scheduling_demo.solve_student_timetable_demo_data()

    assert solution["success"] is False
    assert "No se encontro una solucion factible" in solution["message"]


def test_build_demo_data_contains_required_shapes():
    data = build_demo_data()

    assert data["career_name"] == "Ingenieria de Sistemas"
    assert len(data["rooms"]) > 0
    assert len(data["courses"]) > 0
    assert len(data["students"]) > 0
    assert set(data["patterns_by_blocks"].keys()) == {1, 2, 3}
    assert all(code in data["course_catalog"] for code in [course.code for course in data["courses"]])
