'use client';

import {
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  useEffect,
  useState,
} from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { Room, RoomInput } from '@/types/room';

const initialForm: RoomInput = {
  name: '',
  location: '',
  capacity: 35,
  authorized_capacity: 35,
  room_type: 'Teórica',
  description: '',
  is_active: true,
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<RoomInput>(initialForm);
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
    void loadRooms(page, limit);
  }, [page, limit]);

  async function loadRooms(pageNum: number, pageLimit: number) {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(pageLimit),
      });
      const response = await fetch(`/api/rooms?${params}`, { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudieron cargar las aulas');
      }

      setRooms(data.rooms ?? []);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al cargar aulas');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function startEditing(room: Room) {
    setEditingId(room.id);
    setForm({
      name: room.name,
      location: room.location ?? '',
      capacity: room.capacity,
      authorized_capacity: room.authorized_capacity ?? room.capacity,
      room_type: room.room_type ?? 'Teórica',
      description: room.description ?? '',
      is_active: room.is_active,
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

      const response = await fetch(editingId ? `/api/rooms/${editingId}` : '/api/rooms', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo guardar el aula');
      }

      setSuccess(editingId ? 'Aula actualizada correctamente.' : 'Aula creada correctamente.');
      resetForm();
      await loadRooms(page, limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(room: Room) {
    const confirmed = window.confirm(
      `Se eliminara el aula ${room.name}. ¿Deseas continuar?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/rooms/${room.id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo eliminar el aula');
      }

      if (editingId === room.id) {
        resetForm();
      }

      setSuccess('Aula eliminada correctamente.');
      await loadRooms(page, limit);
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
                <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Infraestructura academica
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Aulas y aforo
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  Registra los salones donde se dictaran los cursos, su aforo disponible,
                  ubicacion y estado operativo para la planificacion academica.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Aulas" value={String(total)} />
                <StatCard
                  label="En página"
                  value={String(rooms.length)}
                />
                <StatCard
                  label="Página"
                  value={`${page} de ${totalPages}`}
                />
                <StatCard
                  label="Capacidad total"
                  value={String(rooms.reduce((sum, room) => sum + room.capacity, 0))}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.02fr_1.28fr]">
            <article className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] lg:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    {editingId ? 'Editar aula' : 'Crear aula'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Registra el salon, su ubicacion y la capacidad maxima disponible.
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
                  <SectionTitle>Identidad del aula</SectionTitle>
                  <div className="grid gap-4">
                    <Field>
                      <Label htmlFor="name">Nombre del aula</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="Aula 101"
                        required
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="location">Ubicacion</Label>
                      <Input
                        id="location"
                        value={form.location}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, location: event.target.value }))
                        }
                        placeholder="Pabellon A - Segundo piso"
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <SectionTitle>Capacidad y estado</SectionTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <Label htmlFor="capacity">Aforo Físico</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min={1}
                        max={1000}
                        value={form.capacity}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            capacity: Number(event.target.value),
                          }))
                        }
                        required
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="authorized_capacity">Aforo Autorizado (SUNEDU)</Label>
                      <Input
                        id="authorized_capacity"
                        type="number"
                        min={1}
                        max={1000}
                        value={form.authorized_capacity}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            authorized_capacity: Number(event.target.value),
                          }))
                        }
                        required
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="room_type">Tipo de Aula</Label>
                      <Select
                        id="room_type"
                        value={form.room_type}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            room_type: event.target.value as RoomInput['room_type'],
                          }))
                        }
                      >
                        <option value="Teórica">Teórica</option>
                        <option value="Laboratorio de Cómputo">Laboratorio de Cómputo</option>
                        <option value="Laboratorio de Ciencias">Laboratorio de Ciencias</option>
                        <option value="Auditorio">Auditorio</option>
                        <option value="Taller">Taller</option>
                      </Select>
                    </Field>

                    <Field>
                      <Label htmlFor="is_active">Estado</Label>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                          <input
                            id="is_active"
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                is_active: event.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          Aula activa
                        </label>
                      </div>
                    </Field>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <SectionTitle>Notas adicionales</SectionTitle>
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
                      placeholder="Ejemplo: aula con proyector, laboratorio o mobiliario especial"
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                    />
                  </Field>

                  <div className="mt-5 rounded-2xl border border-amber-100 bg-white px-4 py-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-600">
                        {editingId
                          ? 'Guarda aqui los cambios del aula seleccionada.'
                          : 'Usa este boton para registrar el nuevo salon en el sistema.'}
                      </p>

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
                          className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-52"
                        >
                          {saving
                            ? 'Guardando...'
                            : editingId
                              ? 'Actualizar aula'
                              : 'Agregar aula'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </form>
            </article>

            <article className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] lg:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Lista de aulas
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Salones disponibles para asignar despues a la planificacion de cursos.
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
                      className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => void loadRooms(page, limit)}
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

              {!loading && rooms.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                  Todavia no hay aulas registradas.
                </div>
              ) : null}

              {!loading && rooms.length > 0 ? (
                <div className="mt-6 flex flex-col gap-4">
                  {rooms.map((room) => (
                    <article
                      key={room.id}
                      className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.95))] p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
                                {room.name}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  room.is_active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {room.is_active ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-black text-slate-950">
                              {room.location?.trim() || 'Ubicacion no registrada'}
                            </h3>
                          </div>

                          <div className="flex shrink-0 gap-3 self-start">
                            <button
                              type="button"
                              onClick={() => startEditing(room)}
                              className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(room)}
                              className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                          <Info label="Aforo Físico" value={String(room.capacity)} />
                          <Info label="Aforo Autorizado" value={String(room.authorized_capacity ?? '-')} />
                          <Info label="Tipo" value={room.room_type ?? '-'} />
                          <Info
                            label="Creada"
                            value={new Date(room.created_at).toLocaleDateString('es-CL')}
                          />
                        </div>

                        <p className="text-sm leading-6 text-slate-600">
                          {room.description?.trim() || 'Sin descripcion registrada.'}
                        </p>
                      </div>
                    </article>
                  ))}
                  
                  {/* Pagination Controls */}
                  <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-slate-700">
                        Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} aulas
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
                                    ? 'bg-amber-500 text-slate-950'
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
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
    />
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
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
