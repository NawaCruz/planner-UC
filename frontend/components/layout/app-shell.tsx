'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

type NavigationItem = {
  href: string;
  label: string;
  description: string;
};

const navigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Resumen del usuario',
  },
  {
    href: '/courses',
    label: 'Cursos',
    description: 'CRUD academico',
  },
  {
    href: '/rooms',
    label: 'Aulas',
    description: 'Salones y aforo',
  },
  {
    href: '/users',
    label: 'Usuarios',
    description: 'Profesores y alumnos',
  },
  {
    href: '/schedule-generator',
    label: 'Schedule Generator',
    description: 'Horario y bloques',
  },
  {
    href: '/green-report',
    label: 'Green Software',
    description: 'Reporte de CO2',
  },
];

function formatRoleLabel(role: string | null) {
  if (role === 'administrador') {
    return 'Administrador';
  }

  if (role === 'profesor') {
    return 'Profesor';
  }

  if (role === 'alumno') {
    return 'Alumno';
  }

  return 'Sin rol';
}

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userRole, logout } = useAuth();
  const visibleNavigationItems =
    userRole === 'administrador'
      ? navigationItems
      : navigationItems.filter(
          (item) =>
            item.href !== '/courses' &&
            item.href !== '/users' &&
            item.href !== '/rooms'
        );

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(90deg,#020617_0%,#020617_22rem,#eff6ff_22rem,#f8fbff_100%)] text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-slate-950 focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>
      <div className="flex min-h-screen w-full flex-col md:flex-row md:items-start">
        <aside className="border-b border-slate-800 bg-[linear-gradient(180deg,#020617_0%,#020b1f_48%,#030712_100%)] px-4 py-5 shadow-[0_24px_80px_rgba(2,6,23,0.34)] md:sticky md:top-0 md:h-screen md:w-80 md:shrink-0 md:self-start md:overflow-y-auto md:border-b-0 md:border-r md:px-7 md:py-8">
          <div className="flex items-center justify-between gap-4 md:flex-col md:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-sky-200">
                Planner UC
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-white">
                Panel de navegacion
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
            >
              Salir
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-700/80 bg-white/8 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur">
            <p className="text-sm font-bold text-white">
              {user?.full_name ?? 'Usuario'}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
              {formatRoleLabel(userRole)}
            </p>
            <p className="mt-3 text-sm text-slate-200">
              {user?.email ?? 'Sin correo disponible'}
            </p>
          </div>

          <nav aria-label="Navegacion principal" className="mt-6 flex flex-col gap-3">
            {visibleNavigationItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`block rounded-3xl border px-4 py-4 transition ${
                    isActive
                      ? 'border-sky-200 bg-[linear-gradient(135deg,#7dd3fc_0%,#38bdf8_100%)] text-slate-950 shadow-[0_18px_40px_rgba(56,189,248,0.32)]'
                      : 'border-slate-700 bg-slate-900/70 text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-slate-500 hover:bg-slate-800/90'
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
                >
                  <p
                    className={`text-sm font-black tracking-wide ${
                      isActive ? 'text-slate-950' : 'text-white'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`mt-1 text-xs font-medium ${
                      isActive ? 'text-slate-900/80' : 'text-slate-300'
                    }`}
                  >
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 hidden md:block">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-3xl border border-red-300/40 bg-red-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Cerrar sesion
            </button>
          </div>
        </aside>

        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 self-stretch bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.16),_transparent_18%),linear-gradient(180deg,#f8fbff_0%,#eff6ff_50%,#f8fafc_100%)] focus:outline-none"
        >
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
