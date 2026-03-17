'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      router.replace(path ? `/login/?redirect=${encodeURIComponent(path)}` : '/login/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
