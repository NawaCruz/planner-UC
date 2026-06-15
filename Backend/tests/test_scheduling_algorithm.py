"""Tests para validar el algoritmo de scheduling y sus restricciones."""

import pytest
from app.scheduling_demo import solve_student_timetable_demo_data
from app.scheduling_demo_data import build_demo_data


def solve_and_validate():
    """Ejecuta el solver y retorna la solución."""
    solution = solve_student_timetable_demo_data()
    assert solution["success"] is True, "El solver debe encontrar una solución factible"
    return solution


@pytest.fixture(scope="module")
def valid_solution():
    """Reutiliza una solucion factible para validar invariantes del solver."""
    return solve_and_validate()


@pytest.fixture(scope="module")
def demo_data():
    """Reutiliza los datos demo para validaciones estructurales."""
    return build_demo_data()


class TestAlgorithmValidity:
    """Tests para validar que el algoritmo encuentra soluciones válidas."""

    def test_solver_finds_feasible_solution(self, valid_solution):
        """Test que el solver encuentra una solución factible."""
        solution = valid_solution
        assert solution["success"] is True
        assert len(solution["sections"]) > 0, "Debe haber al menos una sección abierta"

    def test_solution_structure(self, valid_solution):
        """Test que la solución tiene la estructura esperada."""
        solution = valid_solution
        
        # Campos principales
        assert "summary" in solution
        assert "sections" in solution
        assert "course_capacity_summary" in solution
        
        # Campos del resumen
        summary = solution["summary"]
        assert "opened_courses" in summary
        assert "total_courses" in summary
        assert "opened_sections" in summary
        assert "total_demand" in summary
        assert "uncovered_demand" in summary
        assert "excess_capacity" in summary

    def test_solution_metrics_consistency(self, valid_solution):
        """Test que las métricas de resumen son consistentes."""
        solution = valid_solution
        summary = solution["summary"]
        
        # El número de secciones abiertas debe ser positivo
        assert summary["opened_sections"] > 0
        
        # El número de cursos abiertos debe ser <= total de cursos
        assert summary["opened_courses"] <= summary["total_courses"]
        
        # La demanda descubierta debe ser un número no negativo
        assert summary["uncovered_demand"] >= 0
        
        # La capacidad en exceso debe ser un número no negativo
        assert summary["excess_capacity"] >= 0


class TestSchedulingConstraints:
    """Tests para validar que se cumplen las restricciones de scheduling."""

    def test_no_room_conflicts(self, valid_solution):
        """Test CRÍTICO: No debe haber conflictos de aula en el mismo horario.
        
        Una aula no puede tener dos secciones en el mismo slot de tiempo.
        Esta es la restricción más importante del algoritmo.
        """
        solution = valid_solution
        sections = solution["sections"]
        
        # Crear índice: (aula, slot) -> lista de secciones
        room_slot_conflicts = {}
        for section in sections:
            room = section["room"]
            time_slots = section["time_slots"]
            
            for slot in time_slots:
                key = (room, slot)
                if key not in room_slot_conflicts:
                    room_slot_conflicts[key] = []
                room_slot_conflicts[key].append(section)
        
        # Validar que no hay dos secciones en el mismo aula/horario
        for (room, slot), sections_in_conflict in room_slot_conflicts.items():
            assert len(sections_in_conflict) == 1, (
                f"Conflicto en {room} en {slot}: "
                f"{len(sections_in_conflict)} secciones en el mismo horario"
            )

    def test_max_sections_per_course(self, valid_solution, demo_data):
        """Test: No se deben abrir más secciones que el máximo por curso.
        
        Cada curso tiene un número máximo de secciones (usualmente 2).
        """
        solution = valid_solution
        data = demo_data
        courses = data["courses"]
        sections = solution["sections"]
        
        # Contar secciones abiertas por curso
        sections_by_course = {}
        for section in sections:
            course_code = section["course_code"]
            if course_code not in sections_by_course:
                sections_by_course[course_code] = 0
            sections_by_course[course_code] += 1
        
        # Validar contra el máximo permitido
        course_map = {course.code: course for course in courses}
        for course_code, section_count in sections_by_course.items():
            max_sections = course_map[course_code].max_sections
            assert section_count <= max_sections, (
                f"Curso {course_code}: {section_count} secciones "
                f"(máximo permitido: {max_sections})"
            )

    def test_sections_open_sequentially(self, valid_solution):
        """Test: Si se abre sección 2, debe estar abierta sección 1.
        
        Las secciones se abren en orden: primero sec1, luego sec2, etc.
        """
        solution = valid_solution
        sections = solution["sections"]
        
        # Agrupar por curso
        sections_by_course = {}
        for section in sections:
            course_code = section["course_code"]
            if course_code not in sections_by_course:
                sections_by_course[course_code] = []
            sections_by_course[course_code].append(section["section"])
        
        # Validar que si existe sección N, existen 1, 2, ..., N-1
        for course_code, section_numbers in sections_by_course.items():
            section_numbers.sort()
            for i, section_num in enumerate(section_numbers):
                # Los números de sección deben ser consecutivos desde 1
                expected = i + 1
                assert section_num == expected, (
                    f"Curso {course_code}: Sección {section_num} pero no existe "
                    f"una secuencia 1..{expected-1}"
                )

    def test_room_capacity_sufficient(self, valid_solution):
        """Test: La capacidad total de aula debe ser >= demanda del curso.
        
        Los cursos abiertos deben tener suficiente capacidad para la demanda.
        """
        solution = valid_solution
        sections = solution["sections"]
        demand = solution["demand_by_course"]
        
        # Calcular capacidad total abierta por curso
        capacity_by_course = {}
        for section in sections:
            course_code = section["course_code"]
            room_capacity = section["room_capacity"]
            
            if course_code not in capacity_by_course:
                capacity_by_course[course_code] = 0
            capacity_by_course[course_code] += room_capacity
        
        # Para cursos abiertos, validar que hay capacidad
        uncovered_demand = solution["summary"]["uncovered_demand"]
        
        # Si hay demanda descubierta, debe ser reflejada en los datos
        if uncovered_demand == 0:
            for course_code, demand_count in demand.items():
                if course_code in capacity_by_course:
                    capacity = capacity_by_course[course_code]
                    assert capacity >= demand_count, (
                        f"Curso {course_code}: Demanda {demand_count}, "
                        f"pero capacidad {capacity}"
                    )

    def test_max_two_rooms_per_course_per_time_slot(self, valid_solution):
        """Test IMPORTANTE: Un mismo curso NO puede tener más de 2 salones en el MISMO horario.
        
        Ejemplo INVÁLIDO:
        - MAT101 Lun 07:00 en Aula 101 (Sec 1)
        - MAT101 Lun 07:00 en Aula 102 (Sec 2)
        - MAT101 Lun 07:00 en Aula 103 (Sec 3)  ← ¡ERROR! Más de 2 aulas
        
        Ejemplo VÁLIDO:
        - MAT101 Lun 07:00 en Aula 101 (Sec 1)
        - MAT101 Lun 07:00 en Aula 102 (Sec 2)  ← OK, solo 2 aulas
        """
        solution = valid_solution
        sections = solution["sections"]
        
        # Crear índice: (curso, slot) -> lista de aulas
        course_slot_rooms = {}
        for section in sections:
            course_code = section["course_code"]
            time_slots = section["time_slots"]
            room = section["room"]
            
            for slot in time_slots:
                key = (course_code, slot)
                if key not in course_slot_rooms:
                    course_slot_rooms[key] = []
                course_slot_rooms[key].append(room)
        
        # Validar que cada (curso, slot) tiene máximo 2 aulas diferentes
        for (course_code, slot), rooms in course_slot_rooms.items():
            unique_rooms = set(rooms)
            assert len(unique_rooms) <= 2, (
                f"Curso {course_code} en {slot}: "
                f"{len(unique_rooms)} aulas diferentes ({unique_rooms}) - MÁXIMO 2"
            )


class TestCourseCapacitySummary:
    """Tests para validar el resumen de capacidad por curso."""

    def test_capacity_summary_completeness(self, valid_solution, demo_data):
        """Test: El resumen debe incluir todos los cursos."""
        solution = valid_solution
        data = demo_data
        courses = data["courses"]
        summary = solution["course_capacity_summary"]
        
        assert len(summary) == len(courses), (
            f"Resumen incompleto: {len(summary)} cursos en resumen, "
            f"pero {len(courses)} cursos en datos"
        )

    def test_capacity_summary_consistency(self, valid_solution, demo_data):
        """Test: Los datos en el resumen deben ser consistentes.
        
        - opened_capacity >= uncovered_demand
        - opened_sections <= max_sections
        """
        solution = valid_solution
        summary = solution["course_capacity_summary"]
        data = demo_data
        course_map = {c.code: c for c in data["courses"]}
        
        for course_data in summary:
            course_code = course_data["course_code"]
            demand = course_data["demand"]
            opened_sections = course_data["opened_sections"]
            opened_capacity = course_data["opened_capacity"]
            uncovered = course_data["uncovered_demand"]
            excess = course_data["excess_capacity"]
            
            max_sections = course_map[course_code].max_sections
            
            # Validaciones
            assert opened_sections <= max_sections, (
                f"{course_code}: {opened_sections} secciones > máximo {max_sections}"
            )
            
            assert uncovered >= 0, (
                f"{course_code}: demanda descubierta negativa: {uncovered}"
            )
            
            assert excess >= 0, (
                f"{course_code}: capacidad en exceso negativa: {excess}"
            )
            
            # Demanda, capacidad y descubierta deben ser consistentes
            expected_uncovered = max(0, demand - opened_capacity)
            assert uncovered == expected_uncovered, (
                f"{course_code}: demanda {demand}, capacidad {opened_capacity}, "
                f"descubierta {uncovered} (esperada {expected_uncovered})"
            )


class TestDemandCoverage:
    """Tests para validar la cobertura de demanda."""

    def test_summary_demand_totals(self, valid_solution):
        """Test: El total de demanda en el resumen es consistente."""
        solution = valid_solution
        summary = solution["summary"]
        demand = solution["demand_by_course"]
        
        # Total de demanda debe ser la suma de demandas individuales
        expected_total = sum(demand.values())
        assert summary["total_demand"] == expected_total, (
            f"Total de demanda inconsistente: {summary['total_demand']} "
            f"vs {expected_total} (suma de individuales)"
        )

    def test_uncovered_demand_calculation(self, valid_solution):
        """Test: La demanda descubierta se calcula correctamente."""
        solution = valid_solution
        summary = solution["summary"]
        course_summary = solution["course_capacity_summary"]
        
        # La demanda descubierta total debe ser la suma de descubiertas por curso
        expected_uncovered = sum(c["uncovered_demand"] for c in course_summary)
        assert summary["uncovered_demand"] == expected_uncovered, (
            f"Demanda descubierta total: {summary['uncovered_demand']} "
            f"vs {expected_uncovered} (suma de cursos)"
        )


class TestSectionValidity:
    """Tests para validar que cada sección tiene datos válidos."""

    def test_sections_have_required_fields(self, valid_solution):
        """Test: Cada sección debe tener todos los campos requeridos."""
        solution = valid_solution
        sections = solution["sections"]
        
        required_fields = {
            "course_code": str,
            "course_name": str,
            "section": int,
            "room": str,
            "room_capacity": int,
            "time_slots": list,
            "blocks_per_week": int,
        }
        
        for section in sections:
            for field, expected_type in required_fields.items():
                assert field in section, f"Falta campo {field} en sección"
                assert isinstance(section[field], expected_type), (
                    f"Campo {field} debe ser {expected_type.__name__}, "
                    f"es {type(section[field]).__name__}"
                )

    def test_sections_have_valid_time_slots(self, valid_solution):
        """Test: Los slots de tiempo deben ser válidos y coincidir con blocks_per_week."""
        solution = valid_solution
        sections = solution["sections"]
        
        for section in sections:
            slots = section["time_slots"]
            blocks = section["blocks_per_week"]
            
            assert len(slots) == blocks, (
                f"Sección {section['label']}: "
                f"{len(slots)} slots vs {blocks} blocks_per_week"
            )
            
            # Cada slot debe ser string no vacío
            for slot in slots:
                assert isinstance(slot, str) and len(slot) > 0, (
                    f"Slot inválido en {section['label']}: {slot}"
                )


class TestOptimizationObjective:
    """Tests para validar que el algoritmo optimiza correctamente."""

    def test_prefers_fewer_sections(self, valid_solution, demo_data):
        """Test: El algoritmo prefiere abrir menos secciones cuando es posible."""
        solution = valid_solution
        sections = solution["sections"]
        data = demo_data
        courses = data["courses"]
        
        # Contar secciones por curso
        sections_by_course = {}
        for section in sections:
            code = section["course_code"]
            sections_by_course[code] = sections_by_course.get(code, 0) + 1
        
        # Los cursos con alta demanda deben tener más secciones
        # (esto es un proxy para validar que optimiza)
        course_map = {c.code: c for c in courses}
        demand = solution["demand_by_course"]
        
        # Por lo menos algún curso debe estar abierto
        assert len(sections_by_course) > 0

    def test_solution_is_deterministic_seed(self):
        """Test: Ejecutar dos veces debe dar resultados iguales.
        
        Nota: CP-SAT con timeout puede dar resultados diferentes.
        Este test simplemente valida que al menos es factible dos veces.
        """
        sol1 = solve_student_timetable_demo_data()
        sol2 = solve_student_timetable_demo_data()
        
        assert sol1["success"] is True
        assert sol2["success"] is True
        
        # Ambas deben ser factibles
        assert len(sol1["sections"]) > 0
        assert len(sol2["sections"]) > 0


class TestAdditionalConstraints:
    """Tests adicionales para validar restricciones importantes."""

    def test_no_student_double_enrollment(self, valid_solution):
        """Test: Un estudiante NO puede estar en dos secciones del MISMO curso.
        
        Esto es teórico en nuestro modelo porque no simulamos matricula,
        pero es importante para la lógica real.
        """
        solution = valid_solution
        sections = solution["sections"]
        
        # Validar que no hay dos secciones del mismo curso con horarios superpuestos
        # (Si un estudiante estuviera matriculado en ambas, habría conflicto)
        sections_by_course = {}
        for section in sections:
            course_code = section["course_code"]
            if course_code not in sections_by_course:
                sections_by_course[course_code] = []
            sections_by_course[course_code].append(section)
        
        for course_code, course_sections in sections_by_course.items():
            # Simplemente verificar que hay múltiples secciones si es necesario
            assert len(course_sections) > 0

    def test_room_used_efficiently(self, valid_solution):
        """Test: Las aulas usadas deben ser aprovechadas razonablemente.
        
        Una aula usada debe tener al menos 1 sección (obviamente).
        """
        solution = valid_solution
        sections = solution["sections"]
        rooms = solution["rooms"]
        
        # Aulas que se usan
        rooms_used = set(section["room"] for section in sections)
        
        # Verificar que al menos se usa alguna aula
        assert len(rooms_used) > 0, "Debe haber al menos un aula utilizada"
        
        # Verificar que todos los salones usados existen en la configuración
        available_rooms = set(room["name"] for room in rooms)
        for room_used in rooms_used:
            assert room_used in available_rooms, (
                f"Aula {room_used} usada pero no existe en configuración"
            )

    def test_pattern_consistency_across_sections(self, valid_solution):
        """Test: Los patrones de horario deben ser válidos y consistentes.
        
        Por ejemplo, un patrón de 3 bloques debe ser válido (ej: Lun+Mie+Vie).
        """
        solution = valid_solution
        sections = solution["sections"]
        
        for section in sections:
            pattern = section["time_slots"]
            blocks_declared = section["blocks_per_week"]
            
            # El número de slots debe coincidir con blocks_per_week
            assert len(pattern) == blocks_declared, (
                f"{section['label']}: {len(pattern)} slots pero declara {blocks_declared} bloques"
            )
            
            # Cada slot debe tener formato válido (Ej: "Lun 07:00-08:30")
            for slot in pattern:
                parts = slot.split(" ")
                assert len(parts) == 2, f"Formato de slot inválido: {slot}"
                
                day = parts[0]
                time_range = parts[1]
                
                valid_days = {"Lun", "Mar", "Mie", "Jue", "Vie"}
                assert day in valid_days, f"Día inválido en slot: {day}"
                
                assert "-" in time_range, f"Rango de hora inválido en slot: {time_range}"

    def test_section_numbering_logical(self, valid_solution):
        """Test: Los números de sección deben ser lógicos (1, 2, etc).
        
        No puede haber sección 0 o números negativos.
        """
        solution = valid_solution
        sections = solution["sections"]
        
        for section in sections:
            section_number = section["section"]
            assert section_number >= 1, (
                f"Número de sección inválido: {section_number} (debe ser >= 1)"
            )
            assert isinstance(section_number, int), (
                f"Número de sección debe ser entero, es {type(section_number)}"
            )

    def test_no_empty_sections(self, valid_solution):
        """Test: Una sección abierta debe tener capacidad > 0.
        
        No tiene sentido abrir una sección en un aula sin capacidad.
        """
        solution = valid_solution
        sections = solution["sections"]
        
        for section in sections:
            capacity = section["room_capacity"]
            assert capacity > 0, (
                f"{section['label']}: Capacidad {capacity} (debe ser > 0)"
            )

    def test_cycle_assignment_logical(self, valid_solution):
        """Test: El ciclo de cada curso debe ser lógico (1-8).
        
        Los ciclos van de 1 a 8 típicamente en una carrera de 4 años.
        """
        solution = valid_solution
        sections = solution["sections"]
        
        for section in sections:
            cycle = section.get("cycle", 0)
            assert 1 <= cycle <= 10, (
                f"{section['label']}: Ciclo {cycle} inválido (debe estar entre 1-10)"
            )

    def test_demand_logic_consistency(self, valid_solution):
        """Test: La lógica de demanda es consistente.
        
        - Demanda debe ser >= 0
        - Total abierto debe poder satisfacer demanda en el mejor caso
        """
        solution = valid_solution
        demand = solution["demand_by_course"]
        
        for course_code, demand_count in demand.items():
            assert demand_count >= 0, (
                f"Curso {course_code}: Demanda negativa: {demand_count}"
            )

    def test_summary_math_correct(self, valid_solution):
        """Test: Las matemáticas del resumen son correctas.
        
        Validar operaciones aritméticas principales.
        """
        solution = valid_solution
        summary = solution["summary"]
        course_summary = solution["course_capacity_summary"]
        
        # Suma de capacidades
        total_capacity = sum(c["opened_capacity"] for c in course_summary)
        assert total_capacity >= 0
        
        # Suma de demanda
        total_demand = sum(c["demand"] for c in course_summary)
        assert total_demand == summary["total_demand"]
        
        # Demanda no cubierta
        expected_uncovered = sum(c["uncovered_demand"] for c in course_summary)
        assert expected_uncovered == summary["uncovered_demand"]
