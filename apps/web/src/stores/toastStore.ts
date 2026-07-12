// apps/web/src/stores/toastStore.ts
import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastStoreState {
  toasts: ToastItem[]
  show: (message: string, variant?: ToastVariant, duration?: number) => string
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  show: (message, variant = 'info', duration = 4200) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, variant, duration }] }))
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Fire-and-forget helpers — the whole point is that call sites (async
// error handlers, catch blocks) shouldn't need to know the store shape,
// just `toast.error('thing failed')`.
export const toast = {
  success: (message: string, duration?: number) => useToastStore.getState().show(message, 'success', duration),
  error: (message: string, duration?: number) => useToastStore.getState().show(message, 'error', duration),
  info: (message: string, duration?: number) => useToastStore.getState().show(message, 'info', duration),
}