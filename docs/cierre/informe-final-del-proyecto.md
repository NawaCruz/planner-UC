# Informe Final del Proyecto

## Datos de control

| Campo | Valor |
| --- | --- |
| Proyecto | Planner-UC |
| Equipo | Grupo 05 |
| Fecha del informe | 22 de junio de 2026 |
| Estado evaluado | MVP funcional con alcance pendiente |
| Fuente principal | Repositorio `planner-UC`, rama `main` |
| Corte de evidencia | Commit `83dd8b2`, 15 de junio de 2026 |

## 1. Resumen ejecutivo

Planner-UC es un prototipo web para la planificación académica universitaria y la generación optimizada de oferta horaria.

La solución mantiene dos responsabilidades principales:

- el frontend, desarrollado con Next.js, React, TypeScript y Supabase, gestiona autenticación, autorización por rol, datos académicos y visualización;
- el backend, desarrollado con FastAPI, Python y OR-Tools CP-SAT, resuelve la generación de horarios mediante optimización con restricciones.

El proyecto alcanzó un MVP que permite autenticar usuarios, proteger operaciones administrativas, gestionar cursos, aulas y usuarios, generar una oferta horaria de demostración y visualizarla desde el frontend.

El cierre técnico presenta resultados verificables favorables:

- Quality Gate de SonarQube aprobado;
- cobertura global de 80.1%;
- 66 pruebas frontend aprobadas;
- 39 pruebas backend aprobadas;
- build frontend correcto;
- cero vulnerabilidades productivas reportadas por `npm audit --omit=dev`;
- cero violaciones automáticas WCAG en las ocho rutas evaluadas;
- puntaje SUS promedio de 81.56/100.

El resultado debe considerarse un MVP validado y no un producto institucional listo para producción. El solver todavía trabaja con datos de demostración y no está integrado completamente con los cursos, aulas, docentes y estudiantes persistidos en Supabase.

## 2. Desempeño del alcance

El objetivo general establecido en el Project Charter fue desarrollar un sistema web capaz de generar horarios académicos optimizados, reducir conflictos y mejorar la eficiencia de la planificación.

| Componente | Resultado verificable | Estado |
| --- | --- | --- |
| Modelado del problema | Especificación de entradas, salidas, restricciones y función objetivo. | Cumplido |
| Motor de optimización | Implementación con OR-Tools CP-SAT. | Cumplido con datos demo |
| Prevención de conflictos de aula | Restricción implementada y probada. | Cumplido |
| Gestión de cursos | CRUD mediante API interna y Supabase. | Cumplido |
| Gestión de aulas | CRUD mediante API interna y Supabase. | Cumplido |
| Gestión de usuarios | Usuarios profesor y alumno, con operaciones protegidas para administradores. | Cumplido |
| Disponibilidad docente | No está integrada al solver. | Pendiente |
| Matrícula individual | No existe asignación estudiante por estudiante. | Pendiente |
| Visualización del horario | Vista semanal que consume `/api/scheduling-demo`. | Cumplido con datos demo |
| Integración de persistencia con solver | Los CRUD no alimentan directamente al modelo CP-SAT. | Pendiente |
| Validación técnica | Pruebas unitarias, integración, API, E2E y calidad. | Cumplido |
| Documentación | README, especificación, arquitectura y evidencias versionadas. | Cumplido |

El alcance del MVP se considera parcialmente cumplido. La arquitectura, la gestión administrativa, el solver demo y la visualización están operativos. La integración con datos académicos reales y las restricciones avanzadas permanecen pendientes.

## 3. Desempeño de calidad

| Indicador | Línea base | Resultado final |
| --- | ---: | ---: |
| Cobertura SonarQube | 0.0% por falta de importación | 80.1% |
| Issues de seguridad | 1 | 0 |
| Issues de confiabilidad | 12 | 0 |
| Issues de mantenibilidad | 107 | 0 |
| Duplicación | 6.1% | 0.0% |
| Deuda técnica abierta | 434 min | 0 min |
| Pruebas frontend | No consolidado | 25 suites y 66 pruebas |
| Cobertura de líneas frontend | No consolidado | 82.09% |
| Pruebas backend | No consolidado | 39 pruebas |
| Vulnerabilidades npm productivas | 3 | 0 |
| Violaciones Axe WCAG | 8 | 0 |
| Puntaje SUS | Sin línea base | 81.56/100 |

Las pruebas cubren autenticación, protección de rutas, módulos CRUD, validación de payloads, endpoint FastAPI, restricciones del solver, casos límite, navegación E2E y accesibilidad.

Las mejoras realizadas eliminaron credenciales hardcodeadas, redujeron duplicación, reforzaron validaciones, restringieron CORS, protegieron la configuración inicial y evitaron exponer detalles internos de errores.

No existe evidencia suficiente de pruebas de carga institucionales, operación continua en producción, recuperación ante desastres, monitoreo centralizado o validación del solver con datos reales.

## 4. Desempeño del cronograma

El Project Charter definió un horizonte de 16 semanas:

| Hito | Periodo planificado |
| --- | --- |
| Análisis y requerimientos | Semanas 1 a 2 |
| Diseño | Semanas 3 a 4 |
| Desarrollo | Semanas 5 a 11 |
| Pruebas y validación | Semanas 11 a 15 |
| Entrega final | Semana 16 |

El historial Git evaluado comprende desde el 16 de marzo hasta el 15 de junio de 2026, aproximadamente 13 semanas de actividad.

Los documentos de sprint presentan desviaciones:

- Sprint 1 terminó con 15 puntos pendientes de 30;
- Sprint 2 conserva 25 puntos pendientes al día 14;
- existen tareas registradas como pendientes que posteriormente fueron implementadas;
- los backlogs no reflejan completamente el estado final del código.

No es posible calcular un porcentaje final confiable de cumplimiento temporal porque no existe una línea base fechada completa ni un cierre actualizado de los sprints. El cronograma se considera parcialmente cumplido y con trazabilidad insuficiente.

## 5. Desempeño de costos

| Indicador | Valor documentado |
| --- | ---: |
| Costo total proyectado | $1,680 |
| Costo real acumulado informado | $1,034 |
| Última fecha con costo real incremental | 4 de mayo de 2026 |
| Diferencia respecto del total proyectado | $646 |

La diferencia de $646 no puede considerarse ahorro final porque el costo real dejó de actualizarse mientras el proyecto continuó durante mayo y junio.

El control de costos se considera incompleto. Falta actualizar el costo hasta el cierre, identificar la moneda, documentar el método de estimación y aprobar formalmente el costo final.

## 6. Riesgos e incidentes

### Riesgos principales

| Riesgo | Tratamiento o evidencia | Estado |
| --- | --- | --- |
| Requerimientos incompletos o cambiantes | Evolución incremental del alcance. | Materializado y mitigado parcialmente |
| Vulnerabilidad de acceso | Refuerzo de autenticación, rol, perfil activo y setup. | Mitigado; MFA pendiente |
| Complejidad del algoritmo | CP-SAT modularizado y pruebas backend. | Mitigado para el demo |
| Rendimiento con muchos datos | Paginación y reducción de payloads. | Parcialmente mitigado |
| Datos incorrectos | Validaciones en cursos, aulas, usuarios y JSON. | Mitigado |
| Fallo frontend-backend | Integración y manejo de errores del endpoint demo. | Mitigado para el contrato actual |
| Falta de tiempo | Backlogs incompletos y alcance avanzado pendiente. | Materializado |
| Falta de control del avance | Backlogs desactualizados. | Materializado |

### Incidentes técnicos relevantes

| Incidente | Acción aplicada | Resultado |
| --- | --- | --- |
| SonarQube mostraba 0.0% de cobertura | Importación de reportes Jest y pytest-cov. | 80.1% global |
| Credencial inicial hardcodeada | Variables de entorno y token de setup. | Issue eliminado |
| Duplicación en CRUD y API | Componentes y helpers compartidos. | 0.0% de duplicación |
| Dependencias productivas vulnerables | Actualizaciones y overrides. | 0 vulnerabilidades productivas |
| Problemas de contraste y teclado | Correcciones WCAG y ARIA. | 0 violaciones Axe |
| Fallo de Cypress por variable de entorno | Limpieza previa en scripts. | Ejecución verificable |
| CORS y errores internos amplios | Restricción de CORS y mensajes genéricos. | Menor exposición |

## 7. Entregables y trazabilidad

| Entregable | Evidencia |
| --- | --- |
| Frontend | `frontend/` |
| Backend y solver | `Backend/app/` |
| Pruebas frontend | `frontend/**/__tests__/` y Cypress |
| Pruebas backend | `Backend/tests/` |
| Especificación | `SPEC.md` |
| Arquitectura | `docs/ARC42.md` |
| Costos y riesgos | `docs/planificacion/` |
| Calidad | `docs/sonarqube.md` |
| Seguridad | `docs/owasp.md` |
| Accesibilidad | `docs/wcag.md` |
| Usabilidad | `docs/sus.md` |
| Evidencias | `docs/evidencias/` |

La trazabilidad técnica es sólida en código, pruebas y calidad. Debe mejorarse la correspondencia entre backlog, cronograma, costos, riesgos y estado final.

## 8. Estado final y aceptación recomendada

Se recomienda una aceptación académica condicionada como MVP.

Antes de considerar una liberación institucional se requiere:

1. integrar Supabase con las entradas reales del solver;
2. modelar docentes, disponibilidades y matrícula;
3. validar rendimiento con datos reales;
4. actualizar cronograma, backlog, costos y riesgos;
5. incorporar MFA, monitoreo y alertas;
6. definir respaldo, soporte y operación.

## 9. Conclusión

Planner-UC convirtió una necesidad compleja de planificación académica en un MVP demostrable, modular y técnicamente validado. Los resultados son especialmente sólidos en calidad de código, pruebas, seguridad, accesibilidad y usabilidad.

La principal brecha está en la integración del solver con datos persistidos y en la actualización de los artefactos de gestión. El cierre confirma la viabilidad del prototipo y delimita el trabajo necesario para evolucionarlo hacia una solución institucional.

## Referencias internas

- `README.md`
- `SPEC.md`
- `frontend/README.md`
- `Backend/README.md`
- `docs/inicio/Project Charter.md`
- `docs/planificacion/Backlog del Sprint 1.md`
- `docs/planificacion/Backlog del Sprint 2.md`
- `docs/planificacion/Costo acumulado del proyecto.md`
- `docs/planificacion/Riesgos del proyecto.md`
- `docs/rubrica-cumplimiento.md`
- `docs/sonarqube.md`
- `docs/owasp.md`
- `docs/wcag.md`
- `docs/sus.md`
- `docs/evidencias/README.md`
