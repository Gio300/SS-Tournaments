'use client'

import { useState } from 'react'
import Link from 'next/link'

const CHROME_EXTENSIONS_URL = 'chrome://extensions/'

export default function ExtensionInstallGuidePage() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(CHROME_EXTENSIONS_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="font-display text-xl font-bold text-text-primary mb-4">
        Install Guide
      </h1>
      <p className="text-sm text-text-muted mb-4">
        Keep this window visible. Open a new tab and paste the link below.
      </p>

      <div className="rounded-lg border border-border bg-panel p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Chrome Extensions URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={CHROME_EXTENSIONS_URL}
              className="flex-1 px-3 py-2 rounded-lg bg-bg border border-border text-text-primary text-sm"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-text-muted text-sm">
          <li>Paste <code className="px-1 rounded bg-bg text-text-primary">chrome://extensions/</code> in the address bar and press Enter</li>
          <li>Enable <strong className="text-text-primary">Developer mode</strong> (top-right)</li>
          <li>Click <strong className="text-text-primary">Load unpacked</strong></li>
          <li>Select the extracted <code className="px-1 rounded bg-bg text-text-primary">vidbridge</code> folder</li>
        </ol>
      </div>

      <h2 className="font-semibold text-text-primary mt-6 mb-2">Usage</h2>
      <ul className="list-disc list-inside text-text-muted text-sm space-y-1">
        <li>Sign in to YouTube in Chrome</li>
        <li>Go to Create Highlight and add 2–8 YouTube URLs</li>
        <li>Click Create Highlight – the extension provides your session</li>
      </ul>

      <div className="mt-6">
        <Link href="/reels/create/" className="text-accent hover:underline text-sm">
          Go to Create Highlight
        </Link>
      </div>
    </div>
  )
}
