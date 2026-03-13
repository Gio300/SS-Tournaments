'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username || undefined } },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({ provider })
    if (error) setError(error.message)
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <div className="text-center rounded-2xl border border-border bg-panel p-8">
          <h1 className="font-display text-2xl font-bold text-text-primary mb-4">Check your email</h1>
          <p className="text-text-muted mb-6">
            We&apos;ve sent a confirmation link to <strong className="text-text-primary">{email}</strong>
          </p>
          <Link href="/login/" className="text-accent hover:underline">Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="rounded-2xl border border-border bg-panel p-8">
        <h1 className="font-display text-2xl font-bold text-text-primary text-center mb-6">Create account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#0B0E14] border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              placeholder="striker_fan"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#0B0E14] border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
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
              className="w-full px-4 py-2 rounded-lg bg-[#0B0E14] border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-accent text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create account'}
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
        </div>
        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link href="/login/" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
