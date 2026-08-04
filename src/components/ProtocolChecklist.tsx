'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Sunrise, Sunset, Lock } from 'lucide-react'
import { ModalShell } from '@/components/shared'
import { toast } from 'sonner'

interface Props {
  type: 'apertura' | 'cierre'
  steps: string[]
  onComplete: () => void
  onCancel?: () => void
  forceOpen?: boolean  // if true, can't close without completing
}

export function ProtocolChecklist({ type, steps, onComplete, onCancel, forceOpen = true }: Props) {
  const [checked, setChecked] = useState<boolean[]>(() => steps.map(() => false))
  const isApertura = type === 'apertura'
  const allChecked = checked.every(Boolean)
  const progress = checked.filter(Boolean).length

  const Icon = isApertura ? Sunrise : Sunset
  const accent = isApertura ? 'sage' : 'warn'

  return (
    <ModalShell
      open
      onClose={() => {
        if (!forceOpen && onCancel) onCancel()
        else if (allChecked) onComplete()
        else toast.error('Debes completar todos los pasos del protocolo')
      }}
      title={`Protocolo de ${type}`}
      description={`Marca cada paso como completado (${progress}/${steps.length})`}
      size="md"
      footer={
        <>
          {!forceOpen && onCancel && (
            <button className="btn-ghost text-sm" onClick={onCancel}>
              Cancelar
            </button>
          )}
          <button
            className="btn-sage text-sm"
            disabled={!allChecked}
            onClick={onComplete}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isApertura ? 'Iniciar turno' : 'Finalizar turno'}
          </button>
        </>
      }
    >
      {!allChecked && (
        <div className="mb-4 p-3 rounded-lg bg-[rgba(199,123,92,0.10)] border border-[rgba(199,123,92,0.25)] flex items-start gap-2">
          <Lock className="w-4 h-4 text-[color:var(--warn)] shrink-0 mt-0.5" />
          <p className="text-xs text-foreground">
            {isApertura
              ? 'Debes completar todos los pasos antes de poder acceder al panel de ventas.'
              : 'Debes completar todos los pasos para finalizar el turno correctamente.'}
          </p>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progreso</span>
          <span>{progress} / {steps.length}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${isApertura ? 'bg-[color:var(--sage)]' : 'bg-[color:var(--warn)]'}`}
            style={{ width: `${(progress / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            isApertura
              ? 'bg-[rgba(127,166,155,0.15)] text-sage'
              : 'bg-[rgba(199,123,92,0.15)] text-[color:var(--warn)]'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-serif text-lg">
            {isApertura ? 'Apertura del turno' : 'Cierre del turno'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isApertura
              ? 'Revisa y marca cada paso antes de empezar a vender.'
              : 'Asegúrate de haber completado todo antes de cerrar.'}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {steps.map((step, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() =>
                setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
              }
              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                checked[i]
                  ? isApertura
                    ? 'border-[color:var(--sage)] bg-[rgba(127,166,155,0.08)]'
                    : 'border-[color:var(--warn)] bg-[rgba(199,123,92,0.08)]'
                  : 'border-border bg-background hover:bg-accent'
              }`}
            >
              {checked[i] ? (
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isApertura ? 'text-[color:var(--sage)]' : 'text-[color:var(--warn)]'
                  }`}
                />
              ) : (
                <Circle className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${checked[i] ? 'line-through opacity-60' : ''}`}>
                  {step}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                  Paso {i + 1}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </ModalShell>
  )
}
