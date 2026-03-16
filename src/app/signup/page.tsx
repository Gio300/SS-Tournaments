'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!agreePrivacy) {
      setError('You must agree to the Privacy Policy to create an account.')
      return
    }
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

  async function handleOAuth(provider: 'google' | 'github' | 'facebook') {
    setError('')
    if (!agreePrivacy) {
      setError('You must agree to the Privacy Policy to create an account.')
      return
    }
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
              className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              placeholder="striker_fan"
            />
          </div>
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
              minLength={6}
            />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="mt-1 rounded border-border"
            />
            <span className="text-sm text-text-muted">
              I agree to the <Link href="/privacy/" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
            </span>
          </label>
          {error && <p className="text-accent text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !agreePrivacy}
            className="w-full py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="text-xs text-text-muted mt-2">OAuth signup also requires agreement above.</p>
        <div className="mt-4 flex gap-4">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={!agreePrivacy}
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
          Already have an account?{' '}
          <Link href="/login/" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
