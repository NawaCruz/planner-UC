# Informe Final de Lecciones Aprendidas

## Datos de control

| Campo | Valor |
| --- | --- |
| Proyecto | Planner-UC |
| Equipo | Grupo 05 |
| Fecha del informe | 22 de junio de 2026 |
| Estado evaluado | Cierre del MVP |
| Fuente principal | Repositorio `planner-UC`, rama `main` |
| Corte de evidencia | Commit `83dd8b2`, 15 de junio de 2026 |

## 1. Propósito

Este informe consolida las lecciones aprendidas durante el desarrollo de Planner-UC. Su finalidad es identificar:

- prácticas que produjeron resultados favorables;
- inconvenientes encontrados y solucionados durante la ejecución;
- acciones que conviene repetir en futuros proyectos;
- oportunidades de mejora para una siguiente fase.

Las conclusiones se sustentan en el historial del repositorio, las pruebas automatizadas y las evaluaciones de SonarQube, OWASP, WCAG y SUS.

---

## 2. Prácticas que funcionaron bien

### 2.1. Mantener separadas la gestión y la optimización

**Situación:** El proyecto requería autenticación, persistencia, interfaces administrativas y un motor de optimización matemática.

**Práctica aplicada:** El frontend con Next.js y Supabase asumió la autenticación y gestión administrativa, mientras que FastAPI y OR-Tools CP-SAT quedaron a cargo de la generación de horarios.

**Resultado:** Las dos capas pudieron evolucionar y probarse de manera independiente sin trasladar la lógica del solver al frontend.

**Lección aprendida:** La separación de responsabilidades reduce el acoplamiento y facilita el mantenimiento de sistemas que combinan gestión de datos y optimización.

### 2.2. Modelar las restricciones de forma explícita

**Situación:** La generación de horarios incluye decisiones combinatorias y restricciones que compiten entre sí.

**Práctica aplicada:** Se utilizaron variables, restricciones duras y una función objetivo ponderada dentro de CP-SAT.

**Resultado:** El solver pudo controlar choques de aula, máximos de secciones, continuidad de numeración, demanda no cubierta, exceso de capacidad y conveniencia horaria.

**Lección aprendida:** Un problema complejo de horarios debe representarse mediante reglas formales, verificables y probadas, en lugar de depender de decisiones manuales dispersas.

### 2.3. Combinar diferentes niveles de pruebas

**Situación:** Las pruebas unitarias no cubrían por sí solas la integración, navegación, accesibilidad o experiencia de usuario.

**Práctica aplicada:** Se combinaron Jest, React Testing Library, MSW, pytest, Cypress, Axe, revisión por teclado y SUS.

**Resultado:** Se validaron componentes, rutas API, reglas del solver, flujos completos y aspectos no funcionales.

**Lección aprendida:** La calidad del producto debe evaluarse desde varias perspectivas: funcionamiento, integración, seguridad, accesibilidad y usabilidad.

### 2.4. Utilizar métricas antes y después

**Situación:** Era necesario demostrar que las mejoras realizadas producían resultados reales.

**Práctica aplicada:** Se conservaron líneas base y resultados finales de cobertura, deuda técnica, duplicación, seguridad y accesibilidad.

**Resultado:** Fue posible demostrar mejoras cuantitativas, como:

- cobertura SonarQube de 0.0% reportado a 80.1%;
- issues abiertos de 120 a 0;
- duplicación de 6.1% a 0.0%;
- deuda técnica de 434 minutos a 0;
- violaciones Axe de 8 a 0;
- vulnerabilidades productivas npm de 3 a 0.

**Lección aprendida:** Las métricas comparativas permiten verificar el impacto de una corrección y facilitan la trazabilidad del cierre.

### 2.5. Versionar evidencias reproducibles

**Situación:** Los resultados técnicos debían poder revisarse después de su ejecución.

**Práctica aplicada:** Se almacenaron reportes JSON, CSV, logs, capturas y comandos de validación.

**Resultado:** Las afirmaciones de calidad, seguridad, accesibilidad y usabilidad quedaron respaldadas por evidencia consultable.

**Lección aprendida:** Una evidencia reproducible tiene más valor que una conclusión sin fuente, fecha ni método de obtención.

---

## 3. Inconvenientes encontrados y soluciones aplicadas

Esta sección presenta únicamente inconvenientes que aparecieron durante el proyecto y que cuentan con una solución aplicada y verificable.

### 3.1. Cobertura no visible en SonarQube

**Inconveniente:** El proyecto tenía pruebas automatizadas, pero SonarQube mostraba 0.0% de cobertura porque no recibía los reportes generados por Jest y pytest-cov.

**Solución aplicada:** Se configuraron las rutas de `frontend/coverage/lcov.info` y `Backend/coverage.xml`, y se incorporó la generación de ambos reportes antes del análisis.

**Resultado:** SonarQube pasó a reportar una cobertura global de 80.1%.

**Lección aprendida:** No basta con ejecutar pruebas; también debe verificarse que las herramientas de análisis importen correctamente sus resultados.

### 3.2. SonarQube local inaccesible desde el runner

**Inconveniente:** El runner hospedado de GitHub Actions no podía acceder al servidor SonarQube ejecutado en `localhost:9000`.

**Solución aplicada:** Se configuró un runner self-hosted en Windows y una instalación explícita de SonarScanner.

**Resultado:** El workflow pudo ejecutar el análisis sobre el servidor local y obtener un Quality Gate aprobado.

**Lección aprendida:** La automatización debe diseñarse considerando la ubicación y conectividad real de los servicios utilizados.

### 3.3. Duplicación en pantallas CRUD y rutas administrativas

**Inconveniente:** Los módulos de usuarios, cursos y aulas repetían estructuras de formularios, paginación, autenticación y manejo de respuestas.

**Solución aplicada:** Se extrajeron componentes visuales reutilizables y helpers administrativos compartidos.

**Resultado:** La duplicación reportada por SonarQube se redujo de 6.1% a 0.0%.

**Lección aprendida:** La reutilización debe introducirse cuando existe repetición demostrable, sin realizar refactorizaciones amplias sin necesidad.

### 3.4. Configuración inicial con exposición innecesaria

**Inconveniente:** La configuración inicial utilizaba una credencial hardcodeada y el endpoint de setup no contaba con un secreto adicional.

**Solución aplicada:** Las credenciales se trasladaron a variables de entorno y el setup pasó a exigir un token enviado mediante header.

**Resultado:** El issue de seguridad fue eliminado y el Security Rating de SonarQube mejoró de C a A.

**Lección aprendida:** Los secretos no deben permanecer en el código y los procesos de inicialización deben fallar de forma cerrada cuando falta configuración segura.

### 3.5. Validaciones administrativas insuficientes

**Inconveniente:** El parseo directo de JSON y algunas validaciones débiles podían producir errores no controlados o datos inconsistentes.

**Solución aplicada:** Se incorporaron:

- parseo controlado de JSON;
- validación de correo y contraseña;
- verificación de roles e identificadores;
- control del aforo autorizado respecto de la capacidad física;
- validación de perfil administrativo activo.

**Resultado:** Las rutas administrativas responden de forma controlada y las validaciones quedaron cubiertas por pruebas.

**Lección aprendida:** La validación debe realizarse en servidor, aunque la interfaz también controle los datos.

### 3.6. Configuración CORS y manejo de excepciones demasiado amplios

**Inconveniente:** El backend permitía métodos y headers CORS innecesariamente amplios y podía devolver detalles internos del solver.

**Solución aplicada:** Se restringieron orígenes, métodos y headers, y se reemplazaron los detalles internos por mensajes genéricos para el cliente.

**Resultado:** Las pruebas confirmaron el acceso desde el origen permitido y la ausencia de autorización CORS para orígenes no admitidos.

**Lección aprendida:** Una API debe exponer únicamente las capacidades necesarias y separar los mensajes de usuario de los detalles internos de diagnóstico.

### 3.7. Dependencias productivas con vulnerabilidades

**Inconveniente:** `npm audit --omit=dev` detectó tres vulnerabilidades productivas: una alta y dos moderadas.

**Solución aplicada:** Se actualizó Next.js y se fijaron versiones seguras para dependencias transitivas.

**Resultado:** La auditoría productiva final reportó cero vulnerabilidades.

**Lección aprendida:** La revisión de dependencias debe formar parte del control de calidad y repetirse después de cada actualización relevante.

### 3.8. Problemas de accesibilidad en contraste y navegación

**Inconveniente:** La evaluación inicial con Axe detectó ocho violaciones relacionadas principalmente con contraste y regiones desplazables no accesibles mediante teclado.

**Solución aplicada:** Se ajustaron colores, foco visible, landmarks, encabezados, regiones, etiquetas y roles ARIA.

**Resultado:** Las ocho rutas evaluadas finalizaron con cero violaciones automáticas y con navegación por teclado validada.

**Lección aprendida:** La accesibilidad debe evaluarse sobre la aplicación en funcionamiento y no únicamente mediante revisión visual.

### 3.9. Cypress bloqueado por una variable del entorno

**Inconveniente:** La variable global `ELECTRON_RUN_AS_NODE=1` causaba errores como `bad option: --smoke-test` e impedía verificar Cypress.

**Solución aplicada:** Los scripts del proyecto eliminan esa variable antes de instalar, verificar o ejecutar Cypress.

**Resultado:** Cypress 13.17.0 quedó verificado y las tres pruebas E2E finalizaron sin fallos.

**Lección aprendida:** Los scripts de pruebas deben controlar las particularidades conocidas del entorno para facilitar ejecuciones repetibles.

### 3.10. Fricciones de comprensión identificadas mediante SUS

**Inconveniente:** Los participantes señalaron nomenclatura en inglés, poca información durante la carga y reglas de contraseña poco visibles.

**Solución aplicada:** Se renombró el módulo como `Generador de horarios`, se agregó el mensaje `Cargando acceso...`, se hizo visible la ayuda de contraseña y se mejoraron los estados de éxito y error.

**Resultado:** La interfaz quedó más clara y el estudio SUS registró un promedio de 81.56/100, correspondiente a una aceptabilidad alta.

**Lección aprendida:** Las pruebas con usuarios permiten descubrir fricciones que no aparecen en análisis estáticos ni pruebas unitarias.

---

## 4. Lecciones técnicas consolidadas

| ID | Lección | Evidencia | Aplicación futura |
| --- | --- | --- | --- |
| LT-01 | La separación entre frontend y solver facilita el mantenimiento. | Arquitectura y pruebas independientes | Conservar contratos API explícitos. |
| LT-02 | CP-SAT es adecuado para restricciones académicas combinatorias. | Solver y 39 pruebas backend | Incorporar nuevas reglas como restricciones formales. |
| LT-03 | La integración entre herramientas debe validarse de extremo a extremo. | Cobertura SonarQube de 0.0% a 80.1% | Verificar reportes dentro de CI. |
| LT-04 | La reutilización reduce deuda cuando parte de repetición comprobada. | Duplicación de 6.1% a 0.0% | Extraer componentes y helpers comunes. |
| LT-05 | La autorización y validación pertenecen al servidor. | Rutas administrativas reforzadas | Mantener controles en cada operación sensible. |
| LT-06 | La configuración sensible debe fallar de forma cerrada. | Setup protegido y credenciales externas | Validar secretos obligatorios por entorno. |
| LT-07 | Las dependencias también forman parte de la superficie de seguridad. | Auditoría productiva de 3 a 0 vulnerabilidades | Automatizar auditorías periódicas. |
| LT-08 | La accesibilidad requiere herramientas automáticas y revisión manual. | Axe y validación por teclado | Evaluar nuevas vistas antes de liberarlas. |
| LT-09 | Las pruebas E2E deben ser reproducibles y aisladas. | Cypress verificado y bypass exclusivo de E2E | Mantener configuraciones separadas de producción. |
| LT-10 | La usabilidad se mejora escuchando a usuarios representativos. | SUS 81.56/100 y mejoras aplicadas | Repetir evaluaciones en nuevas fases. |

## 5. Lecciones de gestión consolidadas

| ID | Lección | Resultado observado | Recomendación |
| --- | --- | --- | --- |
| LG-01 | Los hallazgos deben convertirse en acciones verificables. | Cada mejora principal cuenta con evidencia antes/después. | Vincular hallazgo, responsable, corrección y validación. |
| LG-02 | La evidencia debe recopilarse durante el trabajo. | JSON, CSV, logs y capturas facilitaron el cierre. | Definir evidencias desde la planificación. |
| LG-03 | La calidad debe tratarse como actividad continua. | Las correcciones permitieron aprobar el Quality Gate. | Ejecutar análisis en cada iteración. |
| LG-04 | Un MVP necesita límites explícitos. | El resultado demuestra generación demo sin afirmar integración institucional. | Mantener una matriz de alcance incluido y excluido. |
| LG-05 | Los inconvenientes de entorno deben documentarse. | La solución de Cypress y SonarQube quedó reproducible. | Registrar causa, solución y comando de validación. |
| LG-06 | Las retrospectivas deben producir mejoras concretas. | Las observaciones SUS generaron cambios visibles en la interfaz. | Asignar acciones y verificar su implementación. |

## 6. Prácticas recomendadas para futuros proyectos

1. Configurar desde el inicio lint, pruebas, cobertura y análisis de seguridad.
2. Verificar que las métricas sean importadas correctamente por las herramientas.
3. Mantener secretos fuera del código y validar su presencia al iniciar.
4. Aplicar autorización y validación nuevamente en servidor.
5. Registrar inconvenientes con fecha, impacto, solución y evidencia.
6. Incluir accesibilidad y usabilidad dentro de cada iteración.
7. Conservar evidencia antes y después de las correcciones.
8. Mantener separado el entorno E2E del entorno productivo.
9. Actualizar la documentación cuando cambie el comportamiento.
10. Evitar afirmar capacidades que todavía no forman parte del MVP.

## 7. Oportunidades para una siguiente fase

Estas oportunidades no se presentan como inconvenientes corregidos, sino como ampliaciones posteriores al alcance actual:

| Prioridad | Oportunidad | Resultado esperado |
| --- | --- | --- |
| Alta | Integrar Supabase con las entradas del solver. | Generar horarios desde datos persistidos. |
| Alta | Incorporar docentes y disponibilidad. | Controlar conflictos docentes. |
| Alta | Incorporar matrícula individual. | Evaluar cruces por estudiante. |
| Media | Ejecutar pruebas de rendimiento con datasets crecientes. | Conocer límites operativos del solver. |
| Media | Activar MFA y monitoreo centralizado. | Reforzar la operación administrativa. |
| Media | Automatizar Axe dentro de CI. | Prevenir regresiones de accesibilidad. |
| Baja | Crear un onboarding para primer uso. | Facilitar la adopción de nuevos usuarios. |

## 8. Conclusión

Planner-UC demostró que los inconvenientes encontrados durante el desarrollo pudieron convertirse en mejoras concretas y verificables. Los principales aprendizajes se relacionan con integración de herramientas, seguridad de configuración, validación en servidor, reutilización de componentes, accesibilidad y pruebas con usuarios.

La experiencia confirma que una práctica se transforma en lección aprendida cuando el equipo identifica la situación, aplica una solución, valida el resultado y documenta cómo evitar o resolver el mismo inconveniente en proyectos futuros.

## Referencias internas

- `README.md`
- `SPEC.md`
- `frontend/README.md`
- `Backend/README.md`
- `docs/sonarqube.md`
- `docs/owasp.md`
- `docs/wcag.md`
- `docs/sus.md`
- `docs/rubrica-cumplimiento.md`
- `docs/evidencias/README.md`
