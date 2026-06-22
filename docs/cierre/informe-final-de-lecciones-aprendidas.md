# Informe Final de Lecciones Aprendidas

## Datos de control

| Campo | Valor |
| --- | --- |
| Proyecto | Planner-UC |
| Equipo | Grupo 05 |
| Fecha del informe | 22 de junio de 2026 |
| Fuente principal | Repositorio `planner-UC`, rama `main` |
| Corte de evidencia | Commit `83dd8b2`, 15 de junio de 2026 |

## 1. Propósito

Este informe consolida los aprendizajes técnicos y de gestión obtenidos durante el desarrollo de Planner-UC. Las lecciones se derivan de la evolución del repositorio, los backlogs, las correcciones de calidad y seguridad, las pruebas automatizadas y las evaluaciones de accesibilidad y usabilidad.

## 2. Prácticas que funcionaron bien

### 2.1. Separar gestión y optimización

**Situación:** El proyecto necesitaba combinar autenticación, persistencia, interfaces administrativas y optimización matemática.

**Resultado:** Mantener Supabase y Next.js para la gestión, y FastAPI con OR-Tools para el solver, evitó mezclar responsabilidades y permitió probar cada capa de manera independiente.

**Lección:** En sistemas que combinan CRUD y optimización, la separación por capacidades reduce acoplamiento y facilita la evolución.

**Aplicación futura:** Conservar contratos API explícitos y adaptar los datos persistidos a las entradas del solver sin trasladar la optimización al frontend.

### 2.2. Modelar restricciones explícitamente

**Situación:** La generación de horarios incluye restricciones duras y objetivos que compiten entre sí.

**Resultado:** CP-SAT permitió representar choques de aula, máximos de secciones, continuidad de numeración, demanda no cubierta, exceso de capacidad y conveniencia horaria.

**Lección:** Un problema combinatorio debe resolverse mediante un modelo formal y verificable, no con reglas manuales dispersas.

**Aplicación futura:** Incorporar docentes, disponibilidad y matrícula mediante nuevas variables y restricciones documentadas.

### 2.3. Convertir hallazgos de calidad en cambios verificables

**Situación:** La línea base de SonarQube mostraba 120 issues, 6.1% de duplicación, 434 minutos de deuda y cobertura no importada.

**Resultado:** Las correcciones redujeron los issues y la deuda abierta a cero, eliminaron la duplicación y elevaron la cobertura reportada a 80.1%.

**Lección:** Las herramientas de calidad aportan valor cuando cada hallazgo se vincula con una corrección, una prueba y evidencia antes/después.

**Aplicación futura:** Ejecutar quality gates desde el inicio de cada iteración.

### 2.4. Probar la lógica y la experiencia

**Situación:** Las pruebas unitarias no cubren por sí solas errores de navegación, accesibilidad o comprensión.

**Resultado:** La combinación de Jest, React Testing Library, pytest, Cypress, Axe, revisión por teclado y SUS produjo una evaluación integral.

**Lección:** La calidad incluye corrección técnica, seguridad, accesibilidad y usabilidad.

**Aplicación futura:** Mantener pruebas unitarias, de integración, E2E y validaciones no funcionales.

### 2.5. Documentar evidencia reproducible

**Situación:** Los resultados debían ser verificables y no depender únicamente de afirmaciones.

**Resultado:** Se versionaron reportes JSON, CSV, logs, capturas y comandos de ejecución.

**Lección:** La evidencia estructurada mejora la trazabilidad y facilita auditorías posteriores.

**Aplicación futura:** Asociar cada métrica con fecha, versión, comando y entorno de ejecución.

## 3. Prácticas insuficientes y acciones correctivas

### 3.1. Backlog desalineado del estado real

**Problema:** Los documentos de Sprint 1 y Sprint 2 conservan tareas en progreso o pendientes que posteriormente fueron implementadas total o parcialmente.

**Impacto:** No se puede reconstruir con precisión el cronograma ni calcular la velocidad final.

**Acción correctiva:** Actualizar cada historia al cerrar el cambio funcional y vincularla con commits, pruebas y evidencia.

### 3.2. Registro parcial de costos

**Problema:** El costo real acumulado se detiene el 4 de mayo de 2026.

**Impacto:** No puede determinarse el costo final ni la variación respecto del presupuesto.

**Acción correctiva:** Actualizar costos al final de cada sprint e indicar moneda, fuente, responsable y fecha de corte.

### 3.3. Integración tardía de datos reales

**Problema:** Los CRUD persistidos y el solver demo evolucionaron como flujos paralelos.

**Impacto:** El sistema administra cursos y aulas, pero el solver no utiliza directamente esos datos.

**Acción correctiva:** Definir un contrato de entrada común y una capa adaptadora entre Supabase y el backend.

### 3.4. Calidad avanzada incorporada cerca del cierre

**Problema:** La línea base presentó duplicación, deuda técnica, cobertura no reportada y vulnerabilidades que requirieron una fase intensiva de corrección.

**Impacto:** Aumentó el esfuerzo final y el riesgo de regresión.

**Acción correctiva:** Establecer desde el primer sprint umbrales de lint, pruebas, cobertura, dependencias y seguridad en CI.

### 3.5. Riesgos sin cierre formal

**Problema:** El registro conserva todos los riesgos como activos, aunque algunos fueron mitigados o materializados.

**Impacto:** No refleja el riesgo residual real ni la eficacia de las respuestas.

**Acción correctiva:** Revisar por sprint la probabilidad, impacto, responsable, respuesta, evidencia y estado de cada riesgo.

### 3.6. Rutas y nomenclatura documental inconsistentes

**Problema:** Algunos documentos usan `backend/` y otros `Backend/`, además de enlaces absolutos procedentes de otros entornos.

**Impacto:** Disminuye la portabilidad y puede romper enlaces.

**Acción correctiva:** Usar enlaces relativos, respetar las mayúsculas de las carpetas y validar enlaces automáticamente.

## 4. Lecciones técnicas consolidadas

| ID | Lección | Evidencia | Recomendación |
| --- | --- | --- | --- |
| LT-01 | La separación frontend/backend mantuvo responsabilidades claras. | Arquitectura y READMEs | Definir límites antes de implementar. |
| LT-02 | CP-SAT es adecuado para restricciones académicas combinatorias. | Solver y pruebas backend | Mantener restricciones explícitas. |
| LT-03 | Generar cobertura no basta; debe importarse correctamente. | SonarQube: 0.0% a 80.1% | Verificar herramientas en CI. |
| LT-04 | Extraer patrones repetidos reduce deuda. | Duplicación: 6.1% a 0.0% | Refactorizar repetición demostrable. |
| LT-05 | La autorización debe validarse en servidor. | Rutas API administrativas | No confiar solo en la UI. |
| LT-06 | La configuración sensible debe fallar de forma cerrada. | Setup protegido | Validar secretos obligatorios. |
| LT-07 | La accesibilidad mejora la claridad general. | Axe: 8 a 0 violaciones | Evaluar teclado y contraste por sprint. |
| LT-08 | Las pruebas con usuarios detectan fricciones no técnicas. | SUS 81.56 | Evaluar usabilidad antes del cierre. |
| LT-09 | Un demo no demuestra escalabilidad institucional. | Sin pruebas de carga reales | Probar datasets crecientes. |
| LT-10 | La documentación debe evolucionar con el código. | Backlogs y costos desactualizados | Incluirla en Definition of Done. |

## 5. Lecciones de gestión consolidadas

| ID | Lección | Consecuencia | Mejora propuesta |
| --- | --- | --- | --- |
| LG-01 | El backlog debe cerrarse con evidencia. | Estados desactualizados | Vincular historia, commit y prueba. |
| LG-02 | Los costos requieren actualización periódica. | Costo final no calculable | Registrar costo por sprint. |
| LG-03 | Los riesgos deben revisarse durante la ejecución. | Todos permanecen activos | Cerrar o aceptar con evidencia. |
| LG-04 | El MVP debe distinguirse del producto final. | Posible confusión de alcance | Publicar matriz dentro/fuera. |
| LG-05 | La calidad temprana reduce correcciones tardías. | Saneamiento intensivo al final | Aplicar gates desde el inicio. |
| LG-06 | Las decisiones técnicas deben reflejarse en gestión. | Código y planificación desalineados | Revisar documentos en retrospectivas. |

## 6. Acciones recomendadas

| Prioridad | Acción | Resultado esperado |
| --- | --- | --- |
| Alta | Crear el contrato entre Supabase y el solver. | Sustituir los datos demo. |
| Alta | Cerrar backlog, riesgos y costos. | Recuperar trazabilidad administrativa. |
| Alta | Incorporar docentes, disponibilidad y matrícula. | Acercar el MVP al objetivo institucional. |
| Alta | Automatizar lint, pruebas, cobertura y auditoría en CI. | Evitar regresiones. |
| Media | Probar rendimiento con datasets crecientes. | Conocer límites del solver. |
| Media | Activar MFA y monitoreo centralizado. | Reducir riesgo operativo. |
| Media | Automatizar Axe en CI. | Evitar regresiones WCAG. |
| Baja | Corregir enlaces y nombres de carpetas. | Mejorar portabilidad documental. |

## 7. Conclusión

La principal fortaleza del proyecto fue demostrar que la arquitectura y el enfoque de optimización son viables, medibles y mantenibles. La principal debilidad fue la desalineación entre el avance técnico y algunos registros de gestión.

Para futuros proyectos, el equipo debe conservar la separación arquitectónica, el modelado formal, las pruebas automatizadas y la evidencia reproducible. El backlog, los riesgos, los costos y la documentación deben tratarse como componentes activos del producto y actualizarse con la misma disciplina que el código.

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
- `docs/sonarqube.md`
- `docs/owasp.md`
- `docs/wcag.md`
- `docs/sus.md`
- `docs/evidencias/README.md`
