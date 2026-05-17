'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const user = await res.json();
      if (user.role === 'ADMIN') {
        router.push('/hub-admin');
      } else {
        router.push('/hub-empleado');
      }
    } else {
      setError('Contraseña incorrecta');
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-light">
            <Coffee className="h-7 w-7 text-sage" />
          </div>
          <h1 className="text-2xl font-bold text-dark" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.03em' }}>La Cafeta</h1>
          <p className="mt-1 text-sm text-light-grey" style={{ fontFamily: 'var(--font-crimson)', letterSpacing: '-0.03em' }}>Sistema de gestión</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-wellness p-6"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          <label className="mb-1.5 block text-sm font-medium text-grey">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-6 w-full text-sm text-dark placeholder:text-light-grey"
            placeholder="Introduce la contraseña"
            autoFocus
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-sage w-full text-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
