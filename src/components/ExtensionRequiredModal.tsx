'use client'

import Link from 'next/link'

export const EXTENSION_DOWNLOADED_KEY = 'buttonmasherz-extension-downloaded'

export function shouldShowExtensionPrompt(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(EXTENSION_DOWNLOADED_KEY) !== 'true'
}

export function ExtensionRequiredModal({
  show,
  onSkip,
  onDownload,
}: {
  show: boolean
  onSkip: () => void
  onDownload?: () => void
}) {
  if (!show) return null

  function handleDownload() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXTENSION_DOWNLOADED_KEY, 'true')
    }
    onDownload?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onSkip()}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-panel shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-text-primary mb-2">
          ButtonMasherz Extension Required
        </h3>
        <p className="text-sm text-text-muted mb-4">
          ButtonMasherz Extension is required to use this site. Download and install it to continue.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/extension/install/"
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90"
          >
            Download Extension
          </Link>
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
