'use client';

import { useRouter } from 'next/navigation';
import { Package, Users, ClipboardCheck, BarChart3, Coffee, LogOut, Beaker } from 'lucide-react';

const cards = [
  { label: 'Productos', href: '/admin/productos', icon: Package, desc: 'Gestionar productos e inventario' },
  { label: 'Gestión de Personal', href: '/admin/personal', icon: Users, desc: 'Empleados y turnos' },
  { label: 'Protocolos', href: '/admin/protocolos', icon: ClipboardCheck, desc: 'Apertura, cierre y productos' },
  { label: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, desc: 'Estadísticas y métricas' },
  { label: 'Sandbox', href: '/admin/sandbox', icon: Beaker, desc: 'Simulador de ventas y protocolos' },
];

export default function HubAdminPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b border-sage/20 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-light">
            <Coffee className="h-5 w-5 text-sage" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-dark" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.03em' }}>La Cafeta</h1>
            <p className="text-xs text-light-grey">Panel de administración</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
          }}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-light-grey hover:bg-red-50 hover:text-red-500"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-8 text-2xl font-bold text-dark" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.03em' }}>Panel de control</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {cards.map(({ label, href, icon: Icon, desc }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="card-wellness group flex flex-col items-start gap-3 p-6 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-light text-sage group-hover:bg-sage/15">
                <Icon className="h-6 w-6" />
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
