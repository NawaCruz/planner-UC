'use client';

import {
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  useEffect,
  useState,
} from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Course, CourseInput } from '@/types/course';

const initialForm: CourseInput = {
  code: '',
  name: '',
  cycle: 1,
  blocks_per_week: 3,
  max_sections: 2,
  kind: 'carrera',
  description: '',
  is_active: true,
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseInput>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    void loadCourses(page, limit);
  }, [page, limit]);

  async function loadCourses(pageNum: number, pageLimit: number) {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(pageLimit),
      });
      const response = await fetch(`/api/courses?${params}`, { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudieron cargar los cursos');
      }

      setCourses(data.courses ?? []);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al cargar cursos');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function startEditing(course: Course) {
    setEditingId(course.id);
    setForm({
      code: course.code,
      name: course.name,
      cycle: course.cycle,
      blocks_per_week: course.blocks_per_week,
      max_sections: course.max_sections,
      kind: course.kind,
      description: course.description ?? '',
      is_active: course.is_active,
    });
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        editingId ? `/api/courses/${editingId}` : '/api/courses',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo guardar el curso');
      }

      setSuccess(
        editingId ? 'Curso actualizado correctamente.' : 'Curso creado correctamente.'
      );
      resetForm();
      await loadCourses(page, limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(course: Course) {
    const confirmed = window.confirm(
      `Se eliminara el curso ${course.code} - ${course.name}. ¿Deseas continuar?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo eliminar el curso');
      }

      if (editingId === course.id) {
        resetForm();
      }

      setSuccess('Curso eliminado correctamente.');
      await loadCourses(page, limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al eliminar');
    }
  }

  return (
    <ProtectedRoute requiredRole="administrador">
      <AppShell>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-4">
          <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  Gestion academica
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Cursos de universidad
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  Aqui puedes crear, editar, listar y eliminar cursos usando la misma
                  estructura base que el solver del backend: codigo, nombre, ciclo,
                  bloques por semana, maximo de secciones y tipo de curso.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Cursos" value={String(total)} />
                <StatCard
                  label="En página"
                  value={String(courses.length)}
                />
                <StatCard
                  label="Página"
                  value={`${page} de ${totalPages}`}
                />
                <StatCard
                  label="Por página"
                  value={String(limit)}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.02fr_1.28fr]">
            <article className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] lg:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    {editingId ? 'Editar curso' : 'Crear curso'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Completa los datos basicos del curso. El codigo debe ser unico.
                  </p>
                </div>

                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="self-start rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancelar edicion
                  </button>
                ) : null}
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  {success}
                </div>
              ) : null}

              <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <SectionTitle>Identidad del curso</SectionTitle>
                  <div className="grid gap-4 md:grid-cols-[0.9fr_1.5fr]">
                    <Field>
                      <Label htmlFor="code">Codigo</Label>
                      <Input
                        id="code"
                        value={form.code}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            code: event.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="CS101"
                        maxLength={20}
                        required
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="Introduccion a la Programacion"
                        required
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <SectionTitle>Configuracion academica</SectionTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <Label htmlFor="cycle">Ciclo</Label>
                      <Input
                        id="cycle"
                        type="number"
                        min={1}
                        max={12}
                        value={form.cycle}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            cycle: Number(event.target.value),
                          }))
                        }
                        required
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="blocks_per_week">Bloques por semana</Label>
                      <Input
                        id="blocks_per_week"
                        type="number"
                        min={1}
                        max={3}
                        value={form.blocks_per_week}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            blocks_per_week: Number(event.target.value),
                          }))
                        }
                        required
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="max_sections">Maximo de secciones</Label>
                      <Input
                        id="max_sections"
                        type="number"
                        min={1}
                        max={20}
                        value={form.max_sections}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            max_sections: Number(event.target.value),
                          }))
                        }
                        required
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="kind">Tipo</Label>
                      <Select
                        id="kind"
                        value={form.kind}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            kind: event.target.value as CourseInput['kind'],
                          }))
                        }
                      >
                        <option value="carrera">Carrera</option>
                        <option value="general">General</option>
                      </Select>
                    </Field>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <SectionTitle>Detalle adicional</SectionTitle>
                  <Field>
                    <Label htmlFor="description">Descripcion</Label>
                    <textarea
                      id="description"
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Descripcion opcional del curso"
                      rows={4}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </Field>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <SectionTitle>Estado y acciones</SectionTitle>

                  <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            is_active: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Curso activo
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      {editingId ? (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                        >
                          Limpiar formulario
                        </button>
                      ) : null}

                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-44"
                      >
                        {saving
                          ? 'Guardando...'
                          : editingId
                            ? 'Actualizar curso'
                            : 'Crear curso'}
                      </button>
                    </div>
                  </div>
                </section>
              </form>
            </article>

            <article className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] lg:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Lista de cursos
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Cursos registrados para gestionar luego la logica academica.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Por página:</label>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => void loadCourses(page, limit)}
                    className="self-start rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Recargar
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="mt-6 grid gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-28 animate-pulse rounded-3xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : null}

              {!loading && courses.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                  Todavia no hay cursos registrados.
                </div>
              ) : null}

              {!loading && courses.length > 0 ? (
                <div className="mt-6 flex flex-col gap-4">
                  {courses.map((course) => (
                    <article
                      key={course.id}
                      className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.95))] p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
                                {course.code}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  course.kind === 'carrera'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {course.kind === 'carrera' ? 'Carrera' : 'General'}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  course.is_active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {course.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-black text-slate-950">
                              {course.name}
                            </h3>
                          </div>

                          <div className="flex shrink-0 gap-3 self-start">
                            <button
                              type="button"
                              onClick={() => startEditing(course)}
                              className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(course)}
                              className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <Info label="Ciclo" value={String(course.cycle)} />
                          <Info
                            label="Bloques/semana"
                            value={String(course.blocks_per_week)}
                          />
                          <Info
                            label="Max. secciones"
                            value={String(course.max_sections)}
                          />
                        </div>

                        <p className="text-sm leading-6 text-slate-600">
                          {course.description?.trim() || 'Sin descripcion registrada.'}
                        </p>
                      </div>
                    </article>
                  ))}

                  {/* Pagination Controls */}
                  <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-slate-700">
                        Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} cursos
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={page === 1 || loading}
                          onClick={() => setPage(page - 1)}
                          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ← Anterior
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }).map((_, index) => {
                            const pageNum = index + 1;
                            return (
                              <button
                                key={pageNum}
                                type="button"
                                disabled={loading}
                                onClick={() => setPage(pageNum)}
                                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                  pageNum === page
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          disabled={page === totalPages || loading}
                          onClick={() => setPage(page + 1)}
                          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Siguiente →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
      {children}
    </p>
  );
}

function Field({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
    >
      {children}
    </label>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
    />
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
    />
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200/80">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
