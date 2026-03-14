'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export type UserTier = 'free' | 'pro' | 'elite'

export function useSubscription() {
  const { user } = useAuth()
  const [tier, setTier] = useState<UserTier>('free')
  const [clanUltraServerIds, setClanUltraServerIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const uid = user?.id
    if (!uid) {
      setTier('free')
      setClanUltraServerIds(new Set())
      setLoading(false)
      return
    }
    async function fetch() {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier, status, current_period_end')
        .eq('user_id', uid)
        .single()
      if (sub && sub.status === 'active' && sub.current_period_end && new Date(sub.current_period_end) > new Date()) {
        setTier(sub.tier === 'elite' ? 'elite' : sub.tier === 'pro' ? 'pro' : 'free')
      } else {
        setTier('free')
      }
      const { data: members } = await supabase.from('server_members').select('server_id').eq('user_id', uid)
      const serverIds = (members ?? []).map((m) => m.server_id)
      if (serverIds.length) {
        const { data: clans } = await supabase
          .from('servers')
          .select('id, ultra_tier_expires_at')
          .in('id', serverIds)
          .not('ultra_tier_expires_at', 'is', null)
        const ultraIds = new Set(
          (clans ?? [])
            .filter((s) => s.ultra_tier_expires_at && new Date(s.ultra_tier_expires_at) > new Date())
            .map((s) => s.id)
        )
        setClanUltraServerIds(ultraIds)
      } else {
        setClanUltraServerIds(new Set())
      }
      setLoading(false)
    }
    fetch()
  }, [user?.id])

  const hasPro = tier === 'pro' || tier === 'elite'
  const hasElite = tier === 'elite'
  const hasNoAds = hasPro || hasElite
  const isInClanUltra = (serverId: string) => clanUltraServerIds.has(serverId)

  return { tier, hasPro, hasElite, hasNoAds, isInClanUltra, loading }
}
