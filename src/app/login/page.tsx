'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push('/')
  }

  async function handleOAuth(provider: 'google' | 'github' | 'facebook') {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({ provider })
    if (error) setError(error.message)
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="rounded-2xl border border-border bg-panel p-8">
        <h1 className="font-display text-2xl font-bold text-text-primary text-center mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-accent text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 flex gap-4">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="flex-1 py-2 rounded-lg border border-border hover:border-accent/50 text-text-muted hover:text-accent transition-colors"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('github')}
            className="flex-1 py-2 rounded-lg border border-border hover:border-accent/50 text-text-muted hover:text-accent transition-colors"
          >
            GitHub
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('facebook')}
            className="flex-1 py-2 rounded-lg border border-border hover:border-accent/50 text-text-muted hover:text-accent transition-colors"
          >
            Facebook
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/signup/" className="text-accent hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
