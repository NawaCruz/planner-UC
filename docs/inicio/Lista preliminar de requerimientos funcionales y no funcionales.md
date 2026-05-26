# 📋 LISTA PRELIMINAR DE REQUERIMIENTOS (ENFOQUE SMART)

Siguiendo las directrices del docente, los requerimientos han sido validados bajo el enfoque **SMART** (Específicos, Medibles, Alcanzables, Relevantes y Temporales).

### 🔹 Requerimientos Funcionales (RF)
| **ID** | **Nombre del Requerimiento** | **Descripción Técnica** | **Atributos SMART** |
| :--- | :--- | :--- | :--- |
| **RF-01** | Registrar docentes | Registro con código único, especialidad y disponibilidad. | **S**: Datos docentes. **M**: 100% en DB. **T**: S1. |
| **RF-02** | Registrar cursos | Registro con créditos, secciones y prerrequisitos. | **S**: Malla académica. **M**: ID único. **T**: S1. |
| **RF-03** | Registrar aulas | Registro con capacidad (>0) y tipo (Lab/Teoría). | **S**: Recursos físicos. **M**: Aforo > 0. **T**: S1. |
| **RF-04** | Bloques horarios | Definir franjas horarias de 90 min sin traslapes iniciales. | **S**: Estructura temporal. **M**: 0 traslapes. **T**: S2. |
| **RF-05** | Registrar restricciones| Registro de reglas obligatorias (Hard) para el motor. | **S**: Lógica de reglas. **M**: Tabla de reglas. **T**: S2. |
| **RF-06** | Validar datos previos | Bloquear generación si faltan datos base (docentes/aulas). | **S**: QA de entrada. **M**: Error al faltar datos. **T**: S2. |
| **RF-07** | Generar horarios | Algoritmo de asignación automática de docentes y aulas. | **S**: Algoritmo CSP. **M**: 0 conflictos Hard. **T**: S3. |
| **RF-08** | Detectar conflictos | Identificación en tiempo real de traslapes en el horario. | **S**: Verificación. **M**: Reporte de errores. **T**: S2. |
| **RF-09** | Priorizar restricciones| Cumplimiento del 100% de restricciones obligatorias. | **S**: Jerarquía. **M**: 100% éxito Niv. 1. **T**: S3. |
| **RF-10** | Visualizar horarios | Vistas filtradas por docente, curso o aula. | **S**: UX Reporting. **M**: Filtros operativos. **T**: S4. |
| **RF-11** | Ajuste manual | Modificación manual con validación de reglas en < 1s. | **S**: Edición fluida. **M**: Latencia < 1s. **T**: S3. |
| **RF-12** | Re-generar horarios | Nueva ejecución tras cambios en datos o restricciones. | **S**: Iteración. **M**: Nuevo horario válido. **T**: S3. |
| **RF-13** | Consultar horarios | Búsqueda específica por ciclo, docente o ambiente. | **S**: Consultas. **M**: Datos precisos. **T**: S4. |
| **RF-14** | Gestión de roles | Control de acceso según perfil (Admin/Coordinador). | **S**: Seguridad. **M**: Bloqueo de no-autorizados. **T**: S4. |
| **RF-15** | Registro historial | Bitácora de versiones de horarios generados. | **S**: Auditoría. **M**: Log de cambios. **T**: S4. |
| **RF-16** | Reporte incidencias | Emisión de informe técnico si no existe solución válida. | **S**: Feedback. **M**: Informe detallado. **T**: S4. |

---

### 🆕 Requerimientos Funcionales Adicionales — MVP Ampliado

> Identificados a partir del análisis normativo peruano (Ley 30220 - SUNEDU) y entrevistas con stakeholders. Priorizados por facilidad de implementación.

| **ID** | **Nombre del Requerimiento** | **Descripción Técnica** | **Atributos SMART** |
| :--- | :--- | :--- | :--- |
| **RF-NEW-02** | Indicador ratio TC/TP en dashboard | Mostrar el porcentaje de docentes TC vs. TP/Horas asignados en el horario actual (mínimo legal: 25% TC según Art. 82 Ley 30220). | **S**: Cumplimiento normativo. **M**: % visible en dashboard. **T**: MVP. |
| **RF-NEW-04** | Tipo de contrato docente | Registrar si el docente es Tiempo Completo (TC), Tiempo Parcial (TP) o Por Horas. | **S**: Datos docentes. **M**: Campo `contract_type` en DB. **T**: MVP. |
| **RF-NEW-06** | Categoría docente | Registrar la categoría ordinaria: Principal, Asociado, Auxiliar, Contratado o Jefe de Práctica. | **S**: Datos docentes. **M**: Campo `category` en DB. **T**: MVP. |
| **RF-NEW-09** | Capacidad física vs. aforo autorizado | Distinguir entre capacidad física del aula y el aforo máximo autorizado por SUNEDU (1.2 m²/alumno). | **S**: Recursos físicos. **M**: Columna `authorized_capacity` en DB. **T**: MVP. |
| **RF-NEW-14** | Ciclo académico por curso | Indicar a qué ciclo pertenece cada curso (1ro al 10mo) para evitar choques entre cursos del mismo ciclo. | **S**: Malla académica. **M**: Columna `cycle` en DB. **T**: MVP. |
| **RF-NEW-17** | Tipo de aula | Clasificar el aula por tipo: Teórica, Laboratorio de Cómputo, Laboratorio de Ciencias, Auditorio o Taller. | **S**: Recursos físicos. **M**: Columna `room_type` en DB. **T**: MVP. |
| **RF-NEW-21** | Feriados y días no laborables | Bloquear automáticamente fechas de feriados nacionales peruanos y días no laborables del calendario académico. | **S**: Calendario institucional. **M**: Tabla `blocked_dates` en DB. **T**: MVP. |

---

### ⚙️ Requerimientos No Funcionales (RNF)
| **ID** | **Atributo** | **Requerimiento Cuantificable** | **Validación SMART** |
| :--- | :--- | :--- | :--- |
| **RNF-01** | **Rendimiento** | Consultas de horario **≤ 2 s** con 500 registros. | **M**: Latencia medible. **T**: Durante operación. |
| **RNF-02** | **Eficiencia** | Generación de horario base **≤ 60 s**. | **M**: Cronómetro. **T**: Al cierre del Sprint 3. |
| **RNF-03** | **Disponibilidad**| Operatividad **≥ 95%** en entorno de pruebas. | **M**: Logs de Uptime. **T**: Durante las 16 semanas. |
| **RNF-04** | **Seguridad** | 100% de operaciones críticas requieren login. | **S**: Control de acceso. **T**: Desde el Sprint 2. |
| **RNF-05** | **Seguridad** | Contraseñas con **Hash seguro (BCrypt)**. | **S**: Cifrado. **T**: Permanente en DB. |
| **RNF-06** | **Escalabilidad** | Soportar x2 en carga de datos con degradación < 20%. | **M**: Pruebas de carga. **T**: Validado en Sprint 4. |

---

### 🔗 Matriz de Trazabilidad
| **ID** | **Meta del Proyecto** | **Restricción Asociada** | **Prioridad** |
| :--- | :--- | :--- | :---: |
| **RF-07** | Automatización | Tiempo de desarrollo (16 sem) | Alta |
| **RF-09** | Integridad Académica | Disponibilidad docente y aulas | Alta |
| **RNF-02** | Eficiencia | Proceso manual lento | Media |

> [!IMPORTANT]
> Esta documentación sigue las directrices del estándar **ARC42** para asegurar claridad y consistencia técnica.
