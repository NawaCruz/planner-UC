# Backend

Backend del prototipo hecho con `FastAPI` y un demo de generacion de oferta horaria usando `OR-Tools`.

## Librerias principales

- `FastAPI`: expone el resultado del demo como API.
- `Uvicorn`: levanta el servidor local.
- `OR-Tools`: resuelve el problema de horarios como un problema de optimizacion con restricciones.

Dependencias definidas en [pyproject.toml](/e:/Me/2026-1/planner-UC/backend/pyproject.toml).

## Archivo importante

El archivo principal para esta logica es:

- [backend/app/scheduling_demo.py](/e:/Me/2026-1/planner-UC/backend/app/scheduling_demo.py)

La data base del ejemplo vive en:

- [backend/app/scheduling_demo_data.py](/e:/Me/2026-1/planner-UC/backend/app/scheduling_demo_data.py)

## Que hace este demo

Este modulo no matricula estudiante por estudiante.

Lo que hace es construir una propuesta de oferta horaria:

- decide que cursos abrir
- decide cuantas secciones abrir por curso
- decide en que aula abrir cada seccion
- decide con que patron horario abrir cada seccion

La idea es usar la informacion de estudiantes solo como referencia de demanda academica.

## Como correr el proyecto

Desde la carpeta `backend`:

```powershell
uv run uvicorn app.main:app --reload
```

Servidor:

```text
http://127.0.0.1:8000
```

Endpoints utiles:

- `GET /` devuelve un mensaje simple de prueba.
- `GET /api/scheduling-demo` devuelve la solucion del modelo en formato JSON.

## Como correr el demo por consola

Desde la carpeta `backend`:

```powershell
uv run python main.py
```

Ese comando imprime una explicacion textual de la solucion encontrada.

## Como correr los tests

Desde la carpeta `backend`:

```powershell
uv run pytest
```

Ese comando ejecuta toda la suite backend, incluyendo:

- pruebas de API con `FastAPI TestClient`
- pruebas del algoritmo de scheduling
- pruebas unitarias de helpers internos
- pruebas de edge cases del solver

## Como generar cobertura

Desde la carpeta `backend`:

```powershell
uv run pytest --cov=app --cov-report=term-missing --cov-report=html
```

Ese comando:

- muestra la cobertura en consola
- genera un reporte HTML en `backend/htmlcov`

## Herramientas de testing usadas

- `pytest`
- `FastAPI TestClient`
- `pytest-cov`

## Documentacion de testing

El resumen detallado de pruebas implementadas, cobertura, evidencias y comandos de ejecución está en:

- [docs/backend/TEST_DOC.md](/e:/Me/2026-1/planner-UC/docs/backend/TEST_DOC.md)

## Enfoque algoritmico

El algoritmo usa `OR-Tools CP-SAT`.

Eso significa que el problema se formula como un modelo de optimizacion combinatoria con:

- variables de decision
- restricciones
- funcion objetivo

El solver explora miles de combinaciones posibles y busca la mejor solucion factible segun las reglas definidas.

## Tipo de algoritmo que se usa

Internamente no se usa un algoritmo greedy simple ni una regla manual fija.

Se usa un modelo de `programacion por restricciones` con `optimizacion entera booleana`, porque:

- muchas decisiones son de tipo si o no
- existen restricciones duras entre aulas, bloques y secciones
- queremos optimizar varias cosas al mismo tiempo

En terminos didacticos, se puede explicar asi:

1. Se generan todas las opciones razonables de secciones posibles.
2. Cada opcion se convierte en una decision binaria: abrirla o no abrirla.
3. Se agregan reglas para impedir combinaciones invalidas.
4. Se define una funcion de costo para preferir las mejores combinaciones.
5. El solver busca la combinacion de menor costo.

## Como modela el problema

### 1. Datos de entrada

El demo construye:

- una carrera: Ingenieria de Sistemas
- una lista de bloques horarios semanales
- una lista de aulas con capacidad
- una lista de cursos
- una lista de estudiantes

Cada curso tiene:

- codigo
- nombre
- ciclo referencial
- cantidad de bloques por semana
- maximo de secciones
- tipo de curso

Cada estudiante tiene:

- ciclo
- cursos desbloqueados

## Paso 1: estimacion de demanda

Antes de optimizar, el sistema calcula la demanda por curso.

La idea es simple:

- si un estudiante tiene un curso dentro de `unlocked_courses`, se considera que ese curso aporta demanda
- la demanda de un curso es el numero de estudiantes que lo tienen desbloqueado

No es una matricula real.
Es una demanda referencial para decidir cuanta capacidad conviene abrir.

## Paso 2: generacion de patrones horarios

En [backend/app/scheduling_demo_data.py](/e:/Me/2026-1/planner-UC/backend/app/scheduling_demo_data.py) se generan patrones posibles segun la cantidad de bloques del curso.

### Patrones de 1 bloque

Se toma cualquier bloque individual.

Ejemplo:

- `Lun 07:00-08:30`

### Patrones de 2 bloques

Se generan dos tipos:

- dos bloques consecutivos el mismo dia
- dos bloques en dias distintos pero en la misma posicion horaria

Ejemplos:

- `Lun 07:00-08:30` y `Lun 08:40-10:10`
- `Mar 17:20-18:50` y `Jue 17:20-18:50`

### Patrones de 3 bloques

Se generan dos tipos:

- tres bloques consecutivos el mismo dia
- tres bloques repartidos en tres dias distintos con la misma posicion horaria

Esto hace que el sistema no pruebe horarios arbitrarios, sino horarios con estructura academica razonable.

## Paso 3: variables de decision

La variable principal del modelo es una variable booleana por cada candidato de seccion posible.

Una variable representa algo como:

- curso `CS101`
- seccion `1`
- aula `Aula 101`
- patron horario `("Mar 17:20-18:50", "Jue 17:20-18:50", ...)`

Si la variable vale `1`, esa seccion se abre.
Si vale `0`, esa seccion no se abre.

## Paso 4: restricciones

Estas son las reglas mas importantes que el modelo respeta.

### 1. No puede haber choque de aula

Un aula no puede tener dos secciones distintas en el mismo bloque horario.

Explicacion simple:

- si una seccion usa `Aula 101` el lunes a las 07:00
- ninguna otra seccion puede usar esa misma aula en ese mismo bloque

### 2. No se puede abrir mas secciones que el maximo permitido

Cada curso tiene un `max_sections`.

El modelo no puede abrir mas secciones que ese limite.

### 3. Las secciones deben abrirse en orden

Si existe seccion 2 de un curso, entonces tambien debe existir la seccion 1.

Si existe seccion 3, tambien deben existir las anteriores.

Esto evita soluciones raras como abrir directamente la seccion 2 sin abrir la 1.

### 4. Una misma seccion numerada solo puede tomar una configuracion

Por ejemplo, `CS101 seccion 1` no puede abrirse a la vez:

- en `Aula 101` y en `Aula 102`
- o con dos patrones distintos

Debe elegir una sola combinacion final.

## Paso 5: variables auxiliares

El modelo crea variables adicionales para medir calidad de la solucion.

### Demanda no cubierta

Si la capacidad abierta para un curso es menor que la demanda estimada, aparece una penalizacion por demanda no cubierta.

### Capacidad excedente

Si se abre demasiada capacidad respecto a la demanda, tambien aparece penalizacion.

Esto ayuda a evitar:

- quedarse corto
- abrir demasiadas secciones innecesarias

### Curso abierto

Tambien se crea una variable booleana por curso para saber si el curso fue abierto al menos una vez.

## Paso 6: heuristicas de calidad del horario

Ademas de cubrir demanda, el modelo intenta preferir horarios mas convenientes.

### Penalizacion por franja horaria

Los bloques muy temprano o muy tarde tienen mas penalizacion.

Ejemplo de pesos:

- `07:00` penaliza mas
- `19:00` penaliza mas
- `12:00` y `14:00` penalizan menos

Didacticamente:

- el modelo prefiere evitar extremos cuando tiene alternativas

### Penalizacion por patron poco comodo

La funcion `_pattern_convenience_penalty()` penaliza patrones:

- repartidos en muchos dias
- con huecos incomodos entre bloques

Didacticamente:

- se prefieren horarios mas compactos
- se prefieren bloques consecutivos
- se evita fragmentar innecesariamente la semana del curso

## Funcion objetivo

La funcion objetivo minimiza una combinacion ponderada de varios costos:

- demanda no cubierta
- capacidad excedente
- cantidad total de secciones abiertas
- penalizacion por franja horaria
- penalizacion por patron poco conveniente

Y ademas premia ligeramente abrir mas cursos distintos.

En palabras simples:

- primero intenta cubrir demanda
- luego intenta no desperdiciar capacidad
- luego intenta no abrir secciones de mas
- finalmente intenta que los horarios sean mas razonables

## Orden real de prioridades del modelo

Por los pesos usados en el codigo, la prioridad practica es aproximadamente esta:

1. Minimizar demanda no cubierta.
2. Minimizar exceso de capacidad.
3. Minimizar numero de secciones abiertas.
4. Preferir mejores franjas horarias.
5. Preferir patrones mas compactos.
6. Favorecer abrir cursos distintos cuando eso no empeora lo anterior.

Esto se logra con una sola funcion objetivo ponderada.

## Que devuelve el algoritmo

La solucion final incluye:

- cursos abiertos
- secciones abiertas
- aula por seccion
- capacidad por seccion
- bloques asignados
- resumen de demanda total, demanda no cubierta y exceso de capacidad

En API, eso se devuelve como JSON desde:

- `GET /api/scheduling-demo`

## Como explicarlo en una exposicion

Una forma corta y clara de explicarlo seria:

> Usamos OR-Tools con CP-SAT para formular la generacion de horarios como un problema de optimizacion con restricciones. A partir de cursos, aulas, bloques horarios y demanda estimada por estudiantes, el modelo decide que secciones abrir, en que aula y con que patron horario. Luego aplica restricciones para evitar choques y una funcion objetivo para cubrir la mayor demanda posible con horarios compactos y capacidad razonable.

Otra forma aun mas sencilla:

> El sistema no arma horarios manualmente. Primero genera opciones posibles, luego descarta las que violan reglas, y finalmente elige la combinacion mas conveniente usando optimizacion matematica.

## Resumen tecnico rapido

- Tecnologia web: `FastAPI`
- Solver: `OR-Tools CP-SAT`
- Paradigma: programacion por restricciones
- Variables principales: booleanas de apertura de secciones
- Restricciones principales: no choque de aulas, maximo de secciones, consistencia de numeracion
- Objetivo: cubrir demanda con el menor desperdicio y con horarios mas convenientes

## Observaciones importantes

Este demo todavia no hace algunas cosas mas avanzadas, por ejemplo:

- matricular estudiante por estudiante
- evitar cruces de horario entre cursos para un mismo alumno
- modelar docentes
- modelar prerrequisitos directamente dentro del solver
- imponer minimos de alumnos por seccion

Por ahora, el foco esta en construir una buena oferta horaria preliminar.
