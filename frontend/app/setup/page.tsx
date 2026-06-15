'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [adminExists, setAdminExists] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch('/api/setup');
        const data = await response.json();
        setAdminExists(data.exists);
        if (data.exists) {
          setMessage('Admin ya existe. Redirigiendo a login...');
          setTimeout(() => router.push('/login'), 1500);
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Limpiar localStorage y cookies de sesión
    if (globalThis.window !== undefined) {
      globalThis.localStorage.removeItem('sb-jurhjktvifeuobpmrarr-auth-token');
      globalThis.localStorage.clear();
    }
    void checkAdmin();
  }, [router]);

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/setup', { method: 'POST' });
      const data = await response.json();
      
      if (data.created || data.message === 'Admin user created successfully') {
        setMessage('✓ Admin creado! Redirigiendo a login...');
        setTimeout(() => router.push('/login'), 1500);
      } else if (data.exists) {
        setMessage('Admin ya existe. Redirigiendo a login...');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        setError(data.error || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 px-4">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Configuración Inicial</h1>
        
        {message && (
          <div role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
            {message}
          </div>
        )}
        
        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {!message && !adminExists && (
          <button
            onClick={handleSetup}
            disabled={loading}
            className="rounded-lg bg-sky-700 px-6 py-3 font-semibold text-white hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:opacity-50"
          >
            {loading ? 'Creando usuario admin...' : 'Crear Usuario Admin'}
          </button>
        )}
      </div>
    </main>
  );
}
