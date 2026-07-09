// apps/web/src/hooks/useUser.ts
import { useContext } from 'react'
import { AuthContext } from '@/components/auth/AuthProvider'

export function useUser() {
  return useContext(AuthContext)
}