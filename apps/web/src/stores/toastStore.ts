// apps/web/src/stores/toastStore.ts
import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  duration: number
  action?: ToastAction
}

interface ToastStoreState {
  toasts: ToastItem[]
  show: (message: string, variant?: ToastVariant, duration?: number, action?: ToastAction) => string
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  show: (message, variant = 'info', duration = 4200, action) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, variant, duration, action }] }))
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (message: string, duration?: number) => useToastStore.getState().show(message, 'success', duration),
  error: (message: string, duration?: number) => useToastStore.getState().show(message, 'error', duration),
  info: (message: string, duration?: number) => useToastStore.getState().show(message, 'info', duration),
  /**
   * The pattern behind every "Undo" you'll see in Tasks now — mark done /
   * send to limbo / archive / delete all show one of these instead of a
   * blocking confirm dialog. Longer default duration (6s) since acting on
   * it requires reading the message first, not just noticing a checkmark.
   */
  undo: (message: string, onUndo: () => void, duration = 6000) =>
    useToastStore.getState().show(message, 'info', duration, { label: 'undo', onClick: onUndo }),
}