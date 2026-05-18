'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-page">
      <header className="flex items-center justify-between border-b border-sage/20 px-6 py-3">
        <button
          onClick={() => router.push('/hub-admin')}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-sage-light hover:text-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Hub
        </button>
        <ThemeToggle />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
