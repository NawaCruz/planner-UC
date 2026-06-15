'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-slate-950">Planner UC</h1>
          <p className="mt-2 text-sm text-slate-600">
            Gestión inteligente de horarios universitarios
          </p>
        </div>

        <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Credenciales de demostración
          </p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div>
              <p className="font-semibold">Admin:</p>
              <p className="text-slate-600">admin@example.com / password123</p>
            </div>
          </div>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿No tienes cuenta?{' '}
          <a href="mailto:admin@example.com" className="font-semibold text-sky-600 hover:text-sky-700">
            Solicita acceso
          </a>
        </p>
      </div>
    </main>
  );
}
