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
import { useAuth } from '@/lib/auth/auth-context';
import { ManagedUser, ManagedUserForm } from '@/types/user-management';

type RoleOption = {
  id: number;
  name: 'profesor' | 'alumno';
  description: string | null;
};

const initialForm: ManagedUserForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'profesor',
  contract_type: 'TC',
  category: 'Auxiliar',
  is_active: true,
};

const defaultRoles: RoleOption[] = [
  { id: 2, name: 'profesor', description: 'Profesor de la universidad' },
  { id: 3, name: 'alumno', description: 'Alumno de la universidad' },
];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [form, setForm] = useState<ManagedUserForm>(initialForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    void loadUsers(page, limit);
  }, [page, limit]);

  async function loadUsers(pageNum: number, pageLimit: number) {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(pageLimit),
      });
      const response = await fetch(`/api/users?${params}`, { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudieron cargar los usuarios');
      }

      setUsers(data.users ?? []);
      setRoles(data.roles ?? []);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setEditingUserId(null);
  }

  function startEditing(user: ManagedUser) {
    setEditingUserId(user.id);
    setForm({
      full_name: user.full_name ?? '',
      email: user.email,
      password: '',
      role: user.role?.name === 'alumno' ? 'alumno' : 'profesor',
      contract_type: user.contract_type ?? 'TC',
      category: user.category ?? 'Auxiliar',
      is_active: user.is_active,
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

      const body = editingUserId
        ? {
            full_name: form.full_name,
            role: form.role,
            is_active: form.is_active,
            password: form.password,
            contract_type: form.role === 'profesor' ? form.contract_type : null,
            category: form.role === 'profesor' ? form.category : null,
          }
        : {
            ...form,
            contract_type: form.role === 'profesor' ? form.contract_type : null,
            category: form.role === 'profesor' ? form.category : null,
          };

      const response = await fetch(
        editingUserId ? `/api/users/${editingUserId}` : '/api/users',
        {
          method: editingUserId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo guardar el usuario');
      }

      setSuccess(
        editingUserId
          ? 'Usuario actualizado correctamente.'
          : 'Usuario creado correctamente.'
      );
      resetForm();
      await loadUsers(page, limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: ManagedUser) {
    if (user.id === currentUser?.id) {
      setError('No puedes eliminar tu propia cuenta de administrador.');
      setSuccess(null);
      return;
    }

    const confirmed = window.confirm(
      `Se eliminara el usuario ${user.email}. ¿Deseas continuar?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo eliminar el usuario');
      }

      if (editingUserId === user.id) {
        resetForm();
      }

      setSuccess('Usuario eliminado correctamente.');
      await loadUsers(page, limit);
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
                <p className="inline-flex rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-700">
                  Gestion de usuarios
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Profesores y alumnos
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  Desde aqui el administrador puede crear usuarios, asignarles el rol
                  de profesor o alumno, activar o desactivar cuentas y mantener el
                  acceso academico ordenado.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Usuarios" value={String(total)} />
                <StatCard
                  label="En página"
                  value={String(users.length)}
                />
                <StatCard
                  label="Página"
                  value={`${page} de ${totalPages}`}
                />
                <StatCard
                  label="Activos"
                  value={String(users.filter((managedUser) => managedUser.is_active).length)}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.02fr_1.28fr]">
            <article className="rounded-[32px] border border-slate-200 bg-white/92 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] lg:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    {editingUserId ? 'Editar usuario' : 'Crear usuario'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Crea cuentas para profesores y alumnos desde el panel de administrador.
                  </p>
                </div>

                {editingUserId ? (
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
                  <SectionTitle>Datos de acceso</SectionTitle>
                  <div className="grid gap-4">
                    <Field>
                      <Label htmlFor="full_name">Nombre completo</Label>
                      <Input
                        id="full_name"
                        value={form.full_name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            full_name: event.target.value,
                          }))
                        }
                        placeholder="Maria Gonzalez"
                        required
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="email">Correo electronico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        placeholder="usuario@universidad.edu"
                        required
                        disabled={editingUserId !== null}
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="password">
                        {editingUserId ? 'Nueva contraseña opcional' : 'Contraseña inicial'}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        placeholder={
                          editingUserId
                            ? 'Dejar vacio para no cambiarla'
                            : 'Minimo 8 caracteres'
                        }
                        required={!editingUserId}
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <SectionTitle>Perfil academico</SectionTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <Label htmlFor="role">Rol</Label>
                      <Select
                        id="role"
                        value={form.role}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            role: event.target.value as ManagedUserForm['role'],
                          }))
                        }
                      >
                        {(roles.length > 0 ? roles : defaultRoles).map((role) => (
                          <option key={role.name} value={role.name}>
                            {role.name === 'profesor' ? 'Profesor' : 'Alumno'}
                          </option>
                        ))}
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
                            className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
                          />
                          Usuario activo
                        </label>
                      </div>
                    </Field>
                  </div>
                  
                  {form.role === 'profesor' && (
                    <div className="grid gap-4 sm:grid-cols-2 mt-4">
                      <Field>
                        <Label htmlFor="contract_type">Tipo de Contrato</Label>
                        <Select
                          id="contract_type"
                          value={form.contract_type}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              contract_type: event.target.value as ManagedUserForm['contract_type'],
                            }))
                          }
                        >
                          <option value="TC">Tiempo Completo (TC)</option>
                          <option value="TP">Tiempo Parcial (TP)</option>
                          <option value="Por Horas">Por Horas</option>
                        </Select>
                      </Field>
                      <Field>
                        <Label htmlFor="category">Categoría</Label>
                        <Select
                          id="category"
                          value={form.category}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              category: event.target.value as ManagedUserForm['category'],
                            }))
                          }
                        >
                          <option value="Principal">Principal</option>
                          <option value="Asociado">Asociado</option>
                          <option value="Auxiliar">Auxiliar</option>
                          <option value="Contratado">Contratado</option>
                          <option value="Jefe de Práctica">Jefe de Práctica</option>
                        </Select>
                      </Field>
                    </div>
                  )}

                  <div className="mt-5 rounded-2xl border border-fuchsia-100 bg-white px-4 py-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-600">
                        {editingUserId
                          ? 'Guarda aqui los cambios del usuario seleccionado.'
                          : 'Usa este boton para agregar el nuevo usuario al sistema.'}
                      </p>

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        {editingUserId ? (
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
                          className="rounded-2xl bg-fuchsia-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-52"
                        >
                          {saving
                            ? 'Guardando...'
                            : editingUserId
                              ? 'Actualizar usuario'
                              : 'Agregar usuario'}
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
                    Lista de usuarios
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Visualiza cuentas existentes y ajusta su perfil cuando haga falta.
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
                      className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => void loadUsers(page, limit)}
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

              {!loading && users.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                  Todavia no hay usuarios gestionados desde este panel.
                </div>
              ) : null}

              {!loading && users.length > 0 ? (
                <div className="mt-6 flex flex-col gap-4">
                  {users.map((managedUser) => {
                    const isCurrentUser = managedUser.id === currentUser?.id;

                    return (
                      <article
                        key={managedUser.id}
                        className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.95))] p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
                                  {formatRoleLabel(managedUser.role?.name)}
                                </span>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    managedUser.is_active
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {managedUser.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                                {isCurrentUser ? (
                                  <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-800">
                                    Tu cuenta
                                  </span>
                                ) : null}
                              </div>

                              <h3 className="mt-3 text-xl font-black text-slate-950">
                                {managedUser.full_name ?? 'Sin nombre'}
                              </h3>
                              <p className="mt-2 text-sm text-slate-600">
                                {managedUser.email}
                              </p>
                            </div>

                            <div className="flex shrink-0 gap-3 self-start">
                              <button
                                type="button"
                                onClick={() => startEditing(managedUser)}
                                className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(managedUser)}
                                disabled={isCurrentUser}
                                className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>

                          {isCurrentUser ? (
                            <p className="text-sm font-medium text-slate-500">
                              Esta cuenta esta protegida y no puede eliminarse desde el panel.
                            </p>
                          ) : null}

                          <div className="grid gap-3 sm:grid-cols-2">
                            <Info
                              label="Creado"
                              value={new Date(managedUser.created_at).toLocaleDateString('es-CL')}
                            />
                            <Info
                              label="Actualizado"
                              value={new Date(managedUser.updated_at).toLocaleDateString('es-CL')}
                            />
                            {managedUser.role?.name === 'profesor' && managedUser.contract_type && (
                              <Info label="Contrato" value={managedUser.contract_type} />
                            )}
                            {managedUser.role?.name === 'profesor' && managedUser.category && (
                              <Info label="Categoría" value={managedUser.category} />
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  
                  {/* Pagination Controls */}
                  <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-slate-700">
                        Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} usuarios
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
                                    ? 'bg-fuchsia-600 text-white'
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

function formatRoleLabel(role: ManagedUser['role'] extends { name: infer T } ? T : string | undefined) {
  if (role === 'administrador') {
    return 'Administrador';
  }

  if (role === 'profesor') {
    return 'Profesor';
  }

  return 'Alumno';
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
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 disabled:bg-slate-100 disabled:text-slate-500"
    />
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400"
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
