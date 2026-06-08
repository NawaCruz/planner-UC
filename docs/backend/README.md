# Backend - Documentación

Backend del proyecto Planner-UC que genera horarios académicos automáticamente usando optimización matemática.

## 📖 Documentos

Este directorio contiene 3 documentos:

1. **README.md** (este archivo) - Información general y breve
2. **[SCHEDULING_DEMO_ORTOOLS_EXPLAINED.md](SCHEDULING_DEMO_ORTOOLS_EXPLAINED.md)** - Explicación detallada del algoritmo
3. **[TEST_DOC.md](TEST_DOC.md)** - Resumen de pruebas implementadas, cobertura y evidencias

---

## 🎯 ¿Qué Hace el Backend?

El backend proporciona un servidor **FastAPI** que genera automáticamente una propuesta de oferta horaria para una carrera académica. Utiliza **OR-Tools CP-SAT** para resolver el problema de optimización con restricciones.

**Funcionalidades**:

- Estima demanda académica de estudiantes
- Genera patrones horarios posibles
- Optimiza qué cursos abrir y cuántas secciones
- Asigna aulas y horarios
- Respeta restricciones (sin choques, límites, etc.)

---

---

## 🛠️ Tecnologías Utilizadas

| Tecnología     | Versión   | Propósito                                         |
| -------------- | --------- | ------------------------------------------------- |
| **FastAPI**    | ≥ 0.136.0 | Framework web moderno y rápido                    |
| **OR-Tools**   | ≥ 9.15.x  | Solver de optimización con restricciones (CP-SAT) |
| **Uvicorn**    | ≥ 0.44.0  | Servidor ASGI para ejecutar FastAPI               |
| **pytest**     | ≥ 9.0.3   | Framework de testing                              |
| **httpx**      | ≥ 0.28.1  | Cliente HTTP para tests                           |
| **pytest-cov** | ≥ 7.1.0   | Cobertura de código                               |

---

## ⚙️ Algoritmos Utilizados

El backend utiliza **OR-Tools CP-SAT** (Constraint Programming - Satisfiability):

| Algoritmo                    | Función                                      |
| ---------------------------- | -------------------------------------------- |
| **SAT Solving**              | Decisiones binarias (abrir/cerrar secciones) |
| **Constraint Propagation**   | Reduce espacio eliminando opciones inválidas |
| **Branch and Bound**         | Explora árbol de decisiones podando ramas    |
| **Integer Programming**      | Maneja variables auxiliares                  |
| **Weighted Multi-Objective** | Minimiza múltiples objetivos con pesos       |
| **Parallel Search**          | 8 threads explorando simultáneamente         |

### Restricciones Implementadas

- ✅ No superposición en aulas
- ✅ Máximo de secciones por curso
- ✅ Consistencia de numeración
- ✅ Univocidad de secciones

### Función Objetivo

```
Minimizar = 10000×(demanda_no_cubierta)
          + 100×(capacidad_excedente)
          + 10×(número_secciones)
          + penalización_horario
          - cursos_distintos
```

---

## 📊 Estado del Proyecto

| Componente    | Estado         |
| ------------- | -------------- |
| **Servidor**  | ✅ Funcional   |
| **Solver**    | ✅ Funcional   |
| **API**       | ✅ 2 endpoints |
| **Pruebas**   | ✅ 37 tests    |
| **Demo Data** | ✅ Incluido    |

---

## 🧪 Pruebas Implementadas

**Total**: 37 tests aprobados

Cobertura principal:

- endpoints `GET /` y `GET /api/scheduling-demo`
- solver y restricciones principales
- helpers internos
- edge cases
- manejo de errores del endpoint

Detalles completos en [TEST_DOC.md](TEST_DOC.md)

---

## 🚀 Cómo Levantar el Backend

### Requisitos

- Python 3.11+
- `uv` (gestor de paquetes)

### Servidor FastAPI

```powershell
cd backend
uv run uvicorn app.main:app --reload
```

Acceso:

- API: `http://127.0.0.1:8000/api/scheduling-demo`
- Docs: `http://127.0.0.1:8000/docs`

### Demo por Consola

```powershell
cd backend
uv run python main.py
```

### Pruebas

```powershell
cd backend
uv run pytest
```

Con cobertura:

```powershell
cd backend
uv run pytest --cov=app --cov-report=term-missing --cov-report=html
```

---

## 📁 Estructura del Backend

```
backend/
├── app/
│   ├── main.py                  ← Servidor FastAPI
│   ├── scheduling_demo.py       ← Solver OR-Tools CP-SAT
│   └── scheduling_demo_data.py  ← Datos de demostración
├── tests/
│   ├── test_api.py              ← Tests de endpoints
│   ├── test_scheduling_algorithm.py ← Tests del solver
│   ├── test_scheduling_helpers.py ← Tests de helpers
│   └── test_scheduling_edge_cases.py ← Tests de edge cases
├── pyproject.toml               ← Dependencias
└── uv.lock                      ← Lock de dependencias
```

---

## 📚 Documentación Completa

Para más detalles, consulta:

- **[SCHEDULING_DEMO_ORTOOLS_EXPLAINED.md](SCHEDULING_DEMO_ORTOOLS_EXPLAINED.md)** - Explicación línea por línea del algoritmo, internals de OR-Tools, variables, restricciones y función objetivo
- **[TEST_DOC.md](TEST_DOC.md)** - Resumen de pruebas, cobertura, evidencias y comandos de ejecución

---

**Última actualización**: Abril 2026  
**Versión**: 0.1.0
