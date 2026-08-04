'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { Card, Badge, LoadingBlock } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get } from '@/lib/api'
import { todayStr } from '@/lib/format'
import { LivePizarra } from '@/components/pos'
import { Sunrise, Sunset } from 'lucide-react'
import type { Shift, ShiftAssignment, Protocol } from '@/lib/types'

export function TurnoView() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)!
  const [today, setToday] = useState<ShiftAssignment | null>(null)
  const [shift, setShift] = useState<Shift | null>(null)
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const date = todayStr()
        const assignments = await get<ShiftAssignment[]>(
          `/api/shift-assignments?userId=${user.id}&date=${date}`
        )
        if (assignments.length > 0) {
          setToday(assignments[0])
          setShift(assignments[0].shift || null)
        }
        const prots = await get<Protocol[]>('/api/protocols')
        setProtocols(prots)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [user.id])

  const openingSteps = useMemo(() => {
    if (!shift) return [] as string[]
    const raw = shift.openingProtocol
    if (Array.isArray(raw)) return raw as string[]
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as string[] } catch { return [] }
    }
    return [] as string[]
  }, [shift])

  const closingSteps = useMemo(() => {
    if (!shift) return [] as string[]
    const raw = shift.closingProtocol
    if (Array.isArray(raw)) return raw as string[]
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as string[] } catch { return [] }
    }
    return [] as string[]
  }, [shift])

  return (
    <>
      <AppHeader title="Mi Turno" onBack={() => setView('hub-empleado')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <Card><LoadingBlock label="Cargando turno…" /></Card>
        ) : shift ? (
          <div className="card-wellness p-5 mb-6 border-l-4 border-l-[color:var(--sage)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-sage font-semibold mb-1">
                  Turno en curso
                </p>
                <h2 className="font-serif text-2xl text-foreground">
                  Bienvenido, {user.name.split(' ')[0]}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {shift.name} · {shift.startTime}–{shift.endTime}
                </p>
              </div>
              <Badge variant="sage">{today?.role}</Badge>
            </div>
          </div>
        ) : (
          <div className="card-wellness p-5 mb-6 bg-muted/40">
            <p className="text-sm text-muted-foreground">
              No tienes turno asignado hoy. Puedes realizar ventas de todas formas.
            </p>
          </div>
        )}

        {/* Protocols */}
        {(openingSteps.length > 0 || closingSteps.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {openingSteps.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[rgba(127,166,155,0.15)] text-sage flex items-center justify-center">
                    <Sunrise className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-lg">Protocolo de apertura</h3>
                </div>
                <ol className="space-y-2.5">
                  {openingSteps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[color:var(--sage)] text-[color:var(--sage-foreground)] inline-flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed pt-0.5">{s}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
            {closingSteps.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[rgba(199,123,92,0.15)] text-[color:var(--warn)] flex items-center justify-center">
                    <Sunset className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-lg">Protocolo de cierre</h3>
                </div>
                <ol className="space-y-2.5">
                  {closingSteps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[color:var(--warn)] text-white inline-flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed pt-0.5">{s}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </div>
        )}

        {/* POS */}
        <LivePizarra employeeId={user.id} />

        {/* Unused protocol list ref to keep import meaningful */}
        <span className="sr-only">{protocols.length} protocolos cargados</span>
      </main>
    </>
  )
}
