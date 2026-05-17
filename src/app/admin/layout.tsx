'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-4 border-b border-sage/20 px-6 py-3">
        <button
          onClick={() => router.push('/hub-admin')}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-light-grey hover:bg-sage-light hover:text-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Hub
        </button>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
