'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/auth/auth-context';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Lazy loading del componente pesado
const TeacherStats = dynamic(() => import('@/components/dashboard/teacher-stats'), {
  loading: () => <div className="h-40 animate-pulse rounded-lg bg-slate-100"></div>,
  ssr: false, // No renderizar en el servidor para aligerar la carga inicial
});

export default function DashboardPage() {
  const { user, userRole } = useAuth();

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="mx-auto max-w-5xl py-4">
          <div className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Bienvenido, {user?.full_name}!
                </h2>
                <p className="mt-4 text-slate-600">
                  Rol actual:{' '}
                  <span className="font-semibold text-slate-900">
                    {userRole === 'administrador'
                      ? 'Administrador'
                      : userRole === 'profesor'
                        ? 'Profesor'
                        : 'Alumno'}
                  </span>
                </p>
              </div>
              
              {/* Imagen optimizada local con WebP y lazy loading para Green Software */}
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <Image 
                  src="/uni.webp" 
                  alt="Globe del sitio" 
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain p-2"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900">Email</h3>
                <p className="mt-2 text-sm text-slate-600">{user?.email}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900">Estado</h3>
                <p className="mt-2 text-sm">
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-900">
                    {user?.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900">Miembro desde</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('es-CL')
                    : '--'}
                </p>
              </div>
            </div>

            {userRole === 'administrador' && (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border-l-4 border-sky-500 bg-sky-50 p-6">
                  <h3 className="font-semibold text-slate-900">Funciones de administrador</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Tienes acceso completo al sistema. Puedes gestionar usuarios, roles y configuraciones.
                  </p>
                </div>
                
                {/* Usamos el componente lazy-loaded aquí */}
                <TeacherStats />
              </div>
            )}

            {userRole === 'profesor' && (
              <div className="mt-8 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-6">
                <h3 className="font-semibold text-slate-900">Funciones de profesor</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Puedes gestionar tus cursos, calificaciones y ver el horario de tus clases.
                </p>
              </div>
            )}

            {userRole === 'alumno' && (
              <div className="mt-8 rounded-lg border-l-4 border-green-500 bg-green-50 p-6">
                <h3 className="font-semibold text-slate-900">Funciones de alumno</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Puedes ver tu horario, calificaciones y enviar solicitudes académicas.
                </p>
              </div>
            )}
          </div>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
