'use client'

import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Card, LoadingBlock } from '@/components/shared'
import { EmptyState } from '@/components/ui-bits'
import { useAppStore } from '@/lib/store'
import { get } from '@/lib/api'
import type { Product } from '@/lib/types'
import { SandboxPizarra } from '@/components/pos'

export function SandboxView() {
  const setView = useAppStore((s) => s.setView)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get<Product[]>('/api/products?active=true')
      .then((data) => setProducts(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <AppHeader title="Sandbox" onBack={() => setView('hub-admin')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-full bg-accent text-sage flex items-center justify-center">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h1 className="section-title text-2xl sm:text-3xl">Sandbox del administrador</h1>
            <p className="text-sm text-muted-foreground">
              Punto de venta de prueba — las ventas simuladas no se guardan en la base de datos.
            </p>
          </div>
        </div>

        {loading ? (
          <Card><LoadingBlock label="Cargando productos…" /></Card>
        ) : products.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FlaskConical className="w-6 h-6" />}
              title="Sin productos activos"
              description="Activa productos en el catálogo para usar el sandbox."
            />
          </Card>
        ) : (
          <SandboxPizarra products={products} />
        )}
      </main>
    </>
  )
}
