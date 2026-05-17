'use client';

import { useRouter } from 'next/navigation';
import { Coffee, Shield, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  async function loginAs(role: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    if (res.ok) {
      const user = await res.json();
      router.push(user.role === 'ADMIN' ? '/hub-admin' : '/hub-empleado');
    }
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

        <div className="card-wellness p-6 space-y-4">
          <p className="text-center text-sm text-grey mb-4" style={{ fontFamily: 'var(--font-indie)' }}>Selecciona tu perfil</p>

          <button
            onClick={() => loginAs('admin')}
            className="btn-sage w-full flex items-center justify-center gap-3 py-4 text-base"
          >
            <Shield className="h-5 w-5" />
            Panel de Administración
          </button>

          <button
            onClick={() => loginAs('employee')}
            className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-sage/30 bg-white py-4 text-base font-semibold text-dark hover:border-sage hover:bg-sage/5 transition-all"
          >
            <User className="h-5 w-5 text-sage" />
            Portal de Empleado
          </button>

          <p className="mt-4 text-center text-xs text-light-grey" style={{ fontFamily: 'var(--font-hand)' }}>
            acceso sin contraseña — uso interno
          </p>
        </div>
      </div>
    </div>
  );
}
