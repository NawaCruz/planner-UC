"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";

type Summary = {
  opened_courses: number;
  total_courses: number;
  opened_sections: number;
  total_demand: number;
  uncovered_demand: number;
  excess_capacity: number;
};

type Section = {
  course_code: string;
  course_name: string;
  section: number;
  label: string;
  cycle: number;
  kind: string;
  room: string;
  room_capacity: number;
  blocks_per_week: number;
  time_slots: string[];
};

type CapacitySummary = {
  course_code: string;
  course_name: string;
  demand: number;
  opened_sections: number;
  opened_capacity: number;
  uncovered_demand: number;
  excess_capacity: number;
};

type ScheduleResponse = {
  success: boolean;
  career_name: string;
  time_slots: string[];
  students_count: number;
  summary: Summary;
  sections: Section[];
  course_capacity_summary: CapacitySummary[];
  message?: string;
};

const DAY_ORDER = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function slotColor(seed: string) {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (seed.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  return {
    background: `hsl(${hue} 72% 94%)`,
    border: `hsl(${hue} 58% 38%)`,
    accent: `hsl(${hue} 72% 22%)`,
  };
}

function getDayAndRange(slot: string) {
  const [day, range] = slot.split(" ");
  return { day, range };
}

function formatKind(kind: string) {
  return kind === "carrera" ? "Carrera" : "General";
}

function getConnectionStatus(loading: boolean, error: string | null) {
  if (loading) {
    return "Cargando";
  }

  return error ? "Error" : "Conectado";
}

function ScheduleGeneratorContent() {
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSchedule() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("http://localhost:8000/api/scheduling-demo", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`La API respondio con ${response.status}.`);
        }

        const payload: ScheduleResponse = await response.json();

        if (!payload.success) {
          throw new Error(payload.message ?? "No se pudo generar el horario.");
        }

        setData(payload);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "Ocurrio un error inesperado.");
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();

    return () => controller.abort();
  }, []);

  const schedule = useMemo(() => {
    if (!data) {
      return null;
    }

    const uniqueDaySet = new Set<string>();
    const grouped = new Map<string, Section[]>();

    for (const rawSlot of data.time_slots) {
      const { day } = getDayAndRange(rawSlot);
      uniqueDaySet.add(day);
      grouped.set(rawSlot, []);
    }

    for (const section of data.sections) {
      for (const slot of section.time_slots) {
        const entries = grouped.get(slot) ?? [];
        entries.push(section);
        grouped.set(slot, entries);
      }
    }

    const days = Array.from(uniqueDaySet).sort(
      (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b),
    );

    const ranges = data.time_slots
      .map((slot) => getDayAndRange(slot).range)
      .filter((range, index, self) => self.indexOf(range) === index);

    return {
      days,
      ranges,
      grouped,
    };
  }, [data]);

  const topCourses = useMemo(() => {
    if (!data) {
      return [];
    }

    return [...data.course_capacity_summary]
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 6);
  }, [data]);

  const availableCourses = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.sections.reduce<Array<{ code: string; name: string }>>((courses, section) => {
      if (courses.some((course) => course.code === section.course_code)) {
        return courses;
      }

      courses.push({
        code: section.course_code,
        name: section.course_name,
      });
      return courses;
    }, []).sort((a, b) => a.code.localeCompare(b.code));
  }, [data]);

  function matchesFilters(section: Section) {
    const courseMatch =
      selectedCourse === "all" || section.course_code === selectedCourse;

    const dayMatch =
      selectedDays.length === 0 ||
      section.time_slots.some((slot) => selectedDays.includes(getDayAndRange(slot).day));

    return courseMatch && dayMatch;
  }

  function toggleDay(day: string) {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day],
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-4">
        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                Scheduling Demo
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Horario semanal generado desde backend
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Esta vista consume la respuesta de
                {" "}
                <span className="font-semibold text-slate-900">
                  http://localhost:8000/api/scheduling-demo
                </span>
                {" "}
                y la convierte en una grilla semanal con colores por seccion.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Estado"
                value={getConnectionStatus(loading, error)}
              />
              <StatCard
                label="Carrera"
                value={data?.career_name ?? "--"}
              />
              <StatCard
                label="Alumnos"
                value={data ? String(data.students_count) : "--"}
              />
              <StatCard
                label="Secciones"
                value={data ? String(data.summary.opened_sections) : "--"}
              />
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-[28px] border border-slate-200 bg-white/85 p-8 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              {["schedule-loading-1", "schedule-loading-2", "schedule-loading-3", "schedule-loading-4", "schedule-loading-5", "schedule-loading-6"].map((skeletonKey) => (
                <div
                  key={skeletonKey}
                  className="h-28 animate-pulse rounded-3xl bg-slate-100"
                />
              ))}
            </div>
          </section>
        ) : null}

        {!loading && error ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-rose-900 shadow-sm">
            <h2 className="text-xl font-bold">No se pudo cargar el horario</h2>
            <p className="mt-3 text-sm leading-7">
              {error}
              {" "}
              Verifica que el backend este levantado en
              {" "}
              <span className="font-semibold">http://localhost:8000</span>.
            </p>
          </section>
        ) : null}

        {!loading && data && schedule ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Cursos abiertos"
                value={`${data.summary.opened_courses}/${data.summary.total_courses}`}
                detail="Cursos activados por el modelo"
              />
              <SummaryCard
                title="Demanda total"
                value={String(data.summary.total_demand)}
                detail="Solicitudes academicas observadas"
              />
              <SummaryCard
                title="Demanda no cubierta"
                value={String(data.summary.uncovered_demand)}
                detail="Debe quedar en cero idealmente"
              />
              <SummaryCard
                title="Capacidad excedente"
                value={String(data.summary.excess_capacity)}
                detail="Asientos abiertos por encima de la demanda"
              />
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white/90 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6">
              <div className="mb-5 flex flex-col gap-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Grilla semanal
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Cada tarjeta representa una seccion dentro de su franja horaria.
                  Si coinciden varias materias en el mismo bloque, se apilan dentro
                  de la celda.
                </p>
              </div>

              <div className="mb-6 grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.1fr_1.9fr]">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                    Filtrar por curso
                  </span>
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-400"
                    value={selectedCourse}
                    onChange={(event) => setSelectedCourse(event.target.value)}
                  >
                    <option value="all">Todos los cursos</option>
                    {availableCourses.map((course) => (
                      <option key={course.code} value={course.code}>
                        {course.code} · {course.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                    Filtrar por dias
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {schedule.days.map((day) => {
                      const isActive = selectedDays.includes(day);

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            isActive
                              ? "bg-slate-950 text-white shadow-sm"
                              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}

                    {selectedCourse !== "all" || selectedDays.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourse("all");
                          setSelectedDays([]);
                        }}
                        className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100"
                      >
                        Limpiar filtros
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-label="Grilla semanal desplazable"
                className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
              >
                <div className="min-w-[980px]">
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `140px repeat(${schedule.days.length}, minmax(0, 1fr))`,
                    }}
                  >
                    <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                      Hora
                    </div>

                    {schedule.days.map((day) => (
                      <div
                        key={day}
                        className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white"
                      >
                        {day}
                      </div>
                    ))}

                    {schedule.ranges.map((range) => (
                      <FragmentRow
                        key={range}
                        range={range}
                        days={schedule.days}
                        grouped={schedule.grouped}
                        matchesFilters={matchesFilters}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <div className="mb-5">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Capacidad por curso
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Resumen de demanda, capacidad abierta y holgura por asignatura.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {topCourses.map((course) => (
                    <article
                      key={course.course_code}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                            {course.course_code}
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-slate-900">
                            {course.course_name}
                          </h3>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                          {course.opened_sections} secc.
                        </span>
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                        <Metric label="Demanda" value={course.demand} />
                        <Metric label="Capacidad" value={course.opened_capacity} />
                        <Metric label="Sin cubrir" value={course.uncovered_demand} />
                        <Metric label="Exceso" value={course.excess_capacity} />
                      </dl>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <div className="mb-5">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Secciones activas
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Lista visual con el mismo color usado dentro de la grilla.
                  </p>
                </div>

                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Lista de secciones activas desplazable"
                  className="flex max-h-[720px] flex-col gap-3 overflow-y-auto pr-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
                >
                  {data.sections.map((section) => {
                    const colors = slotColor(section.label);
                    const isHighlighted = matchesFilters(section);

                    return (
                      <article
                        key={section.label}
                        className={`rounded-3xl border p-4 transition ${
                          isHighlighted ? "opacity-100 saturate-100" : "opacity-35 saturate-50"
                        }`}
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className="text-xs font-bold uppercase tracking-[0.22em]"
                              style={{ color: colors.accent }}
                            >
                              {section.course_code}
                            </p>
                            <h3 className="mt-1 text-base font-bold text-slate-900">
                              {section.course_name}
                            </h3>
                          </div>
                          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                            Seccion {section.section}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-700">
                          Ciclo {section.cycle} · {formatKind(section.kind)} · {section.room}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {section.time_slots.join(" · ")}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

type FragmentRowProps = Readonly<{
  range: string;
  days: readonly string[];
  grouped: Map<string, Section[]>;
  matchesFilters: (section: Section) => boolean;
}>;

function FragmentRow({
  range,
  days,
  grouped,
  matchesFilters,
}: FragmentRowProps) {
  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
        {range}
      </div>

      {days.map((day) => {
        const sections = grouped.get(`${day} ${range}`) ?? [];

        return (
          <div
            key={`${day}-${range}`}
            className="min-h-28 rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.95))] p-2"
          >
            <div className="flex h-full flex-col gap-2">
              {sections.length > 0 ? (
                sections.map((section) => {
                  const colors = slotColor(section.label);
                  const isHighlighted = matchesFilters(section);

                  return (
                    <article
                      key={`${section.label}-${day}-${range}`}
                      className={`rounded-2xl border p-3 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition ${
                        isHighlighted ? "opacity-100 saturate-100" : "opacity-30 saturate-50"
                      }`}
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      }}
                    >
                      <p
                        className="text-[11px] font-black uppercase tracking-[0.2em]"
                        style={{ color: colors.accent }}
                      >
                        {section.course_code}
                      </p>
                      <h3 className="mt-1 text-sm font-bold leading-5 text-slate-900">
                        {section.course_name}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-slate-700">
                        Sec. {section.section} · {section.room}
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="flex h-full min-h-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-xs font-medium text-slate-600">
                  Libre
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function StatCard({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  detail,
}: Readonly<{
  title: string;
  value: string;
  detail: string;
}>) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
        {title}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
      <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-black text-slate-900">{value}</dd>
    </div>
  );
}

export default function ScheduleGeneratorPage() {
  return (
    <ProtectedRoute>
      <ScheduleGeneratorContent />
    </ProtectedRoute>
  );
}
