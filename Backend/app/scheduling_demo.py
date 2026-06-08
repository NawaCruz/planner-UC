from __future__ import annotations

from ortools.sat.python import cp_model

from app.scheduling_demo_data import Course, Room, Student, build_demo_data


def _slot_start_minutes(slot: str) -> int:
    _, hour_range = slot.split(" ", 1)
    start_hour = hour_range.split("-", 1)[0]
    hour_text, minute_text = start_hour.split(":")
    return int(hour_text) * 60 + int(minute_text)


def _pattern_convenience_penalty(pattern: tuple[str, ...]) -> int:
    slots_by_day: dict[str, list[int]] = {}

    for slot in pattern:
        day, _ = slot.split(" ", 1)
        slots_by_day.setdefault(day, []).append(_slot_start_minutes(slot))

    unique_days = len(slots_by_day)
    penalty = (unique_days - 1) * 40

    for day_slots in slots_by_day.values():
        day_slots.sort()

        for index in range(1, len(day_slots)):
            gap_minutes = day_slots[index] - day_slots[index - 1]

            if gap_minutes == 100:
                continue

            penalty += 12 + max(0, (gap_minutes - 100) // 10)

    return penalty


def _build_schedule_solution() -> dict:
    data = build_demo_data()
    career_name: str = data["career_name"]
    time_slots: tuple[str, ...] = data["time_slots"]
    rooms: tuple[Room, ...] = data["rooms"]
    courses: tuple[Course, ...] = data["courses"]
    students: tuple[Student, ...] = data["students"]
    patterns_by_blocks: dict[int, tuple[tuple[str, ...], ...]] = data["patterns_by_blocks"]
    course_catalog: dict[str, dict[str, object]] = data["course_catalog"]

    room_capacity = {room.name: room.capacity for room in rooms}
    course_map = {course.code: course for course in courses}
    demand_by_course = {
        course.code: sum(1 for student in students if course.code in student.unlocked_courses)
        for course in courses
    }
    slot_preference_weight = {}
    for slot in time_slots:
        _, hour_range = slot.split(" ", 1)
        start_hour = hour_range.split("-", 1)[0]
        slot_preference_weight[slot] = {
            "07:00": 6,
            "08:40": 4,
            "10:20": 2,
            "12:00": 0,
            "14:00": 0,
            "15:40": 2,
            "17:20": 4,
            "19:00": 6,
        }[start_hour]
    pattern_preference_weight = {
        pattern: _pattern_convenience_penalty(pattern)
        for patterns in patterns_by_blocks.values()
        for pattern in patterns
    }

    model = cp_model.CpModel()

    section_vars: dict[tuple[str, int, str, tuple[str, ...]], cp_model.IntVar] = {}

    candidate_sections: list[tuple[str, int, str, tuple[str, ...]]] = []
    sections_by_course: dict[str, list[tuple[str, int, str, tuple[str, ...]]]] = {
        course.code: [] for course in courses
    }
    sections_by_course_number: dict[tuple[str, int], list[tuple[str, int, str, tuple[str, ...]]]] = {}
    sections_by_room_slot: dict[tuple[str, str], list[tuple[str, int, str, tuple[str, ...]]]] = {}
    sections_by_cycle_slot: dict[tuple[int, str], list[tuple[str, int, str, tuple[str, ...]]]] = {}

    for course in courses:
        patterns = patterns_by_blocks[course.blocks_per_week]
        for section_number in range(1, course.max_sections + 1):
            for room in rooms:
                for pattern in patterns:
                    section_key = (course.code, section_number, room.name, pattern)
                    candidate_sections.append(section_key)
                    sections_by_course[course.code].append(section_key)
                    sections_by_course_number.setdefault((course.code, section_number), []).append(
                        section_key
                    )

                    section_label = (
                        f"{course.code}_sec{section_number}_{room.name}_{'_'.join(pattern)}"
                        .replace(" ", "_")
                        .replace(":", "")
                    )
                    section_vars[section_key] = model.NewBoolVar(f"open_{section_label}")

                    for slot in pattern:
                        sections_by_room_slot.setdefault((room.name, slot), []).append(section_key)
                        sections_by_cycle_slot.setdefault((course.cycle, slot), []).append(section_key)

    if not candidate_sections:
        return {
            "success": False,
            "message": "No se encontro una solucion factible para el prototipo.",
        }

    for sections in sections_by_room_slot.values():
        model.Add(sum(section_vars[section] for section in sections) <= 1)

    for sections in sections_by_cycle_slot.values():
        model.Add(sum(section_vars[section] for section in sections) <= 1)

    for course in courses:
        model.Add(
            sum(section_vars[section] for section in sections_by_course[course.code])
            <= course.max_sections
        )

    for course in courses:
        for section_number in range(2, course.max_sections + 1):
            previous_sections = sections_by_course_number[(course.code, section_number - 1)]
            current_sections = sections_by_course_number[(course.code, section_number)]
            model.Add(
                sum(section_vars[section] for section in current_sections)
                <= sum(section_vars[section] for section in previous_sections)
            )

    for sections in sections_by_course_number.values():
        model.Add(sum(section_vars[section] for section in sections) <= 1)

    total_open_sections = sum(section_vars.values())

    uncovered_demand_vars: dict[str, cp_model.IntVar] = {}
    excess_capacity_vars: dict[str, cp_model.IntVar] = {}
    for course in courses:
        served_capacity = sum(
            room_capacity[room_name] * section_vars[(course.code, section_number, room_name, pattern)]
            for section_number in range(1, course.max_sections + 1)
            for room_name in room_capacity
            for pattern in patterns_by_blocks[course.blocks_per_week]
        )
        uncovered = model.NewIntVar(0, demand_by_course[course.code], f"uncovered_{course.code}")
        uncovered_demand_vars[course.code] = uncovered
        model.Add(uncovered >= demand_by_course[course.code] - served_capacity)
        max_capacity = sum(room.capacity for room in rooms) * course.max_sections
        excess_capacity = model.NewIntVar(0, max_capacity, f"excess_{course.code}")
        excess_capacity_vars[course.code] = excess_capacity
        model.Add(excess_capacity >= served_capacity - demand_by_course[course.code])

    course_open_vars: dict[str, cp_model.IntVar] = {}
    for course in courses:
        course_open = model.NewBoolVar(f"course_open_{course.code}")
        course_open_vars[course.code] = course_open
        model.Add(
            sum(section_vars[section] for section in sections_by_course[course.code]) >= course_open
        )
        model.Add(
            sum(section_vars[section] for section in sections_by_course[course.code])
            <= course.max_sections * course_open
        )

    total_opened_course_codes = sum(course_open_vars.values())
    total_uncovered_demand = sum(uncovered_demand_vars.values())
    total_excess_capacity = sum(excess_capacity_vars.values())
    total_schedule_penalty = sum(
        sum(slot_preference_weight[slot] for slot in pattern) * section_vars[section_key]
        for section_key in candidate_sections
        for pattern in [section_key[3]]
    )
    total_pattern_penalty = sum(
        pattern_preference_weight[pattern] * section_vars[section_key]
        for section_key in candidate_sections
        for pattern in [section_key[3]]
    )
    model.Minimize(
        total_uncovered_demand * 10000 + total_excess_capacity * 100 + total_open_sections * 10
        + total_schedule_penalty
        + total_pattern_penalty
        - total_opened_course_codes
    )

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10
    solver.parameters.num_search_workers = 8

    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "success": False,
            "message": "No se encontro una solucion factible para el prototipo.",
        }

    open_sections = [
        section for section in candidate_sections if solver.Value(section_vars[section]) == 1
    ]
    open_sections.sort(key=lambda item: (item[0], item[1], item[2], item[3]))

    calendar_sections: list[dict[str, object]] = []
    for course_code, section_number, room_name, pattern in open_sections:
        course = course_map[course_code]
        calendar_sections.append(
            {
                "course_code": course.code,
                "course_name": course.name,
                "section": section_number,
                "label": f"{course.code} - Seccion {section_number}",
                "cycle": course.cycle,
                "kind": course.kind,
                "room": room_name,
                "room_capacity": room_capacity[room_name],
                "blocks_per_week": course.blocks_per_week,
                "time_slots": list(pattern),
            }
        )

    course_capacity_summary = []
    for course in courses:
        open_count = sum(
            solver.Value(section_vars[section]) for section in sections_by_course[course.code]
        )
        total_capacity = sum(
            room_capacity[section[2]] * solver.Value(section_vars[section])
            for section in sections_by_course[course.code]
        )
        course_capacity_summary.append(
            {
                "course_code": course.code,
                "course_name": course.name,
                "demand": demand_by_course[course.code],
                "opened_sections": open_count,
                "opened_capacity": total_capacity,
                "uncovered_demand": solver.Value(uncovered_demand_vars[course.code]),
                "excess_capacity": solver.Value(excess_capacity_vars[course.code]),
            }
        )

    return {
        "success": True,
        "career_name": career_name,
        "time_slots": list(time_slots),
        "rooms": [
            {"name": room.name, "capacity": room.capacity}
            for room in rooms
        ],
        "courses": [
            {
                "code": course.code,
                "name": course.name,
                "cycle": course.cycle,
                "blocks_per_week": course.blocks_per_week,
                "max_sections": course.max_sections,
                "kind": course.kind,
            }
            for course in courses
        ],
        "students_count": len(students),
        "course_catalog": course_catalog,
        "demand_by_course": demand_by_course,
        "summary": {
            "opened_courses": sum(solver.Value(var) for var in course_open_vars.values()),
            "total_courses": len(courses),
            "opened_sections": len(open_sections),
            "total_demand": sum(demand_by_course.values()),
            "uncovered_demand": sum(
                solver.Value(var) for var in uncovered_demand_vars.values()
            ),
            "excess_capacity": sum(
                solver.Value(var) for var in excess_capacity_vars.values()
            ),
        },
        "sections": calendar_sections,
        "course_capacity_summary": course_capacity_summary,
    }


def solve_student_timetable_demo_data() -> dict:
    return _build_schedule_solution()


def solve_student_timetable_demo() -> str:
    solution = _build_schedule_solution()
    if not solution["success"]:
        return solution["message"]

    career_name = solution["career_name"]
    rooms = solution["rooms"]
    students_count = solution["students_count"]
    course_catalog = solution["course_catalog"]
    demand_by_course = solution["demand_by_course"]
    open_sections = solution["sections"]
    summary = solution["summary"]

    lines = [
        "DEMO OR-TOOLS: plan de apertura de cursos para Ingenieria de Sistemas",
        "",
        "Idea central para la exposicion:",
        f"- Carrera analizada: {career_name}.",
        "- Todos los alumnos pertenecen a una sola carrera, pero estan en ciclos distintos.",
        "- Cada alumno tiene una lista de cursos desbloqueados segun lo que ya aprobo.",
        "- Si un alumno no aprobo un prerrequisito, ese curso todavia no aparece en su lista.",
        "- El problema no es matricular estudiante por estudiante; la data estudiantil solo se usa como referencia de demanda.",
        "- Lo que queremos decidir es que cursos y cuantas secciones conviene abrir en la oferta horaria.",
        "",
        "Conceptos clave:",
        "- Bloque: una franja de clase de 1 hora y 30 minutos.",
        "- En este demo la universidad puede programar clases desde las 07:00 hasta las 21:00, en bloques de 90 minutos.",
        "- Curso: una asignatura que requiere 1, 2 o 3 bloques por semana.",
        "- Seccion: una oferta completa del curso; una seccion agrupa todos los bloques semanales de ese curso.",
        "- Ejemplo: si Base de Datos I tiene 3 bloques, una seccion podria ser Mar 17:20-18:50, Mar 19:00-20:30 y Jue 17:20-18:50.",
        "- Idealmente los bloques se agrupan juntos y, si se puede, en uno o dos dias; solo se usa una distribucion mas partida cuando hace falta.",
        "",
        "Diccionario de cursos del ejemplo:",
    ]

    for code, details in course_catalog.items():
        lines.append(
            f"- {code}: {details['nombre']} | ciclo sugerido {details['ciclo_referencial']} | "
            f"{details['tipo']} | {details['bloques_por_semana']} bloques/semana | "
            f"max {details['maximo_secciones']} secciones"
        )

    lines.extend(
        [
            "",
            "Aulas disponibles:",
        ]
    )
    for room in rooms:
        lines.append(f"- {room['name']}: capacidad {room['capacity']}")

    lines.extend(
        [
            "",
            "Datos de demanda cargados:",
            f"- Total de estudiantes considerados: {students_count}",
            "- La lista detallada de estudiantes se usa internamente para estimar demanda por curso.",
        ]
    )

    lines.extend(
        [
            "",
            "Que decide el modelo:",
            "- Decision 1: si abrir o no cada curso.",
            "- Decision 2: cuantas secciones abrir por curso, hasta un maximo definido.",
            "- Decision 3: en que aula y con que patron horario abrir cada seccion.",
            "- La matricula final del estudiante ocurre despues; aqui solo se construye la oferta horaria.",
            "",
            "Restricciones del modelo:",
            "- Un aula no puede tener dos secciones en el mismo bloque.",
            "- Una seccion abierta no puede superar la capacidad del aula donde se programa.",
            "- En esta version no se exige minimo de alumnos para abrir una seccion.",
            "- La data de estudiantes solo empuja demanda: si mas alumnos tienen desbloqueado un curso, conviene abrir mas capacidad para ese curso.",
            "",
            "Demanda detectada por curso:",
        ]
    )

    for code, details in course_catalog.items():
        lines.append(
            f"- {code} ({details['nombre']}): {demand_by_course[code]} estudiantes lo tienen desbloqueado"
        )

    lines.extend(["", "Secciones abiertas por el modelo:"])

    for section in open_sections:
        lines.append(
            f"- {section['course_code']} sec {section['section']} ({section['course_name']}) en {section['room']}: "
            f"{' | '.join(section['time_slots'])} | capacidad {section['room_capacity']}"
        )

    lines.extend(
        [
            "",
            "Resumen de la solucion:",
            f"- Cursos abiertos: {summary['opened_courses']} de {summary['total_courses']}",
            f"- Secciones abiertas: {summary['opened_sections']}",
            f"- Demanda academica total observada: {summary['total_demand']}",
            f"- Demanda no cubierta estimada: {summary['uncovered_demand']}",
            f"- Capacidad excedente estimada: {summary['excess_capacity']}",
            "",
            "Capacidad abierta por curso:",
        ]
    )

    for course_summary in solution["course_capacity_summary"]:
        lines.append(
            f"- {course_summary['course_code']}: demanda {course_summary['demand']} | "
            f"secciones {course_summary['opened_sections']} | capacidad abierta {course_summary['opened_capacity']} | "
            f"demanda no cubierta {course_summary['uncovered_demand']} | exceso {course_summary['excess_capacity']}"
        )

    lines.extend(
        [
            "",
            "Como lo puedes explicar al presentar:",
            "- Primero definimos cursos, aulas y estudiantes de Ingenieria de Sistemas.",
            "- Luego, para cada curso, indicamos cuantos bloques necesita por semana.",
            "- Despues, para cada estudiante, cargamos solo los cursos que tiene desbloqueados.",
            "- Con esa informacion calculamos la demanda referencial de cada curso.",
            "- El modelo no matricula alumnos; solo abre secciones completas en aulas y horarios posibles.",
            "- El resultado final dice que oferta conviene aperturar antes del proceso real de matricula.",
        ]
    )

    return "\n".join(lines)
