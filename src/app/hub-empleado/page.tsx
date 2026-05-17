'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlayCircle, Calendar, BarChart3, Coffee, LogOut, AlertCircle } from 'lucide-react';

const cards = [
  { label: 'Mi Turno', href: '/turno', icon: PlayCircle, desc: 'Ver y gestionar mi turno actual' },
  { label: 'Calendario', href: '/turno/calendario', icon: Calendar, desc: 'Calendario de turnos asignados' },
  { label: 'Dashboard', href: '/turno/dashboard', icon: BarChart3, desc: 'Métricas de rendimiento' },
];

export default function HubEmpleadoPage() {
  const router = useRouter();
  const [pendingDebts, setPendingDebts] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((me) => {
        if (me.id) {
          return fetch(`/api/shift-debts?userId=${me.id}`).then((r) => r.json());
        }
        return [];
      })
      .then((debts) => {
        setPendingDebts(debts.filter((d: { isPaid: boolean }) => !d.isPaid).length);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b border-sage/20 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-light">
            <Coffee className="h-5 w-5 text-sage" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-dark" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.03em' }}>La Cafeta</h1>
            <p className="text-xs text-light-grey">Portal del empleado</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingDebts > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">{pendingDebts} deuda{pendingDebts > 1 ? 's' : ''} pendiente{pendingDebts > 1 ? 's' : ''}</span>
            </div>
          )}
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-light-grey hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mb-8 text-2xl font-bold text-dark" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.03em' }}>Bienvenido</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {cards.map(({ label, href, icon: Icon, desc }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="card-wellness group flex flex-col items-center gap-4 p-8 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-light text-sage group-hover:bg-sage/15">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark">{label}</h3>
                <p className="mt-1 text-sm text-light-grey">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
