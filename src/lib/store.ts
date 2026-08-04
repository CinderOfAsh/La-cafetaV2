'use client'

import { create } from 'zustand'
import type { AuthUser } from './types'

export type View =
  | 'login'
  | 'hub-admin'
  | 'hub-empleado'
  | 'admin-productos'
  | 'admin-personal'
  | 'admin-protocolos'
  | 'admin-dashboard'
  | 'admin-sandbox'
  | 'admin-asignar'
  | 'turno'
  | 'turno-calendario'
  | 'turno-dashboard'

interface AppState {
  user: AuthUser | null
  view: View
  selectedUserId?: string
  hydrated: boolean
  setHydrated: (v: boolean) => void
  setUser: (u: AuthUser | null) => void
  setView: (v: View) => void
  setSelectedUserId: (id?: string) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  view: 'login',
  selectedUserId: undefined,
  hydrated: false,
  setHydrated: (v) => set({ hydrated: v }),
  setUser: (u) =>
    set({
      user: u,
      view: u ? (u.role === 'ADMIN' ? 'hub-admin' : 'hub-empleado') : 'login',
    }),
  setView: (v) => set({ view: v }),
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  logout: () => set({ user: null, view: 'login', selectedUserId: undefined }),
}))
