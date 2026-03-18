'use client'

import { useState, useEffect } from 'react'
import { shouldShowExtensionPrompt } from '@/components/ExtensionRequiredModal'

export function useExtensionPrompt(triggerKey: string) {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (shouldShowExtensionPrompt()) {
      setShowPrompt(true)
    }
  }, [triggerKey])

  function dismissPrompt() {
    setShowPrompt(false)
  }

  return { showPrompt, dismissPrompt }
}
