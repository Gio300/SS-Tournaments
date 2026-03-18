'use client'

import Link from 'next/link'
import { basePath } from '@/lib/basePath'
import { getVidBridgeInstallUrl } from '@/lib/vidbridge'

export default function ExtensionInstallPage() {
  const installUrl = getVidBridgeInstallUrl()
  const isChromeStore = installUrl.startsWith('https://chrome.google.com')

  function handleDownload() {
    if (isChromeStore) {
      window.open(installUrl, '_blank')
      return
    }
    const zipUrl = `${basePath ? basePath + '/' : ''}vidbridge.zip`
    const link = document.createElement('a')
    link.href = zipUrl
    link.download = 'vidbridge.zip'
    link.click()

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const pathPrefix = basePath ? `${basePath}/` : '/'
    const guideUrl = `${origin}${pathPrefix}extension/install/guide/`
    window.open(
      guideUrl,
      'extensionGuide',
      'width=500,height=750,left=0,top=0,scrollbars=yes,resizable=yes'
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        Install VidBridge
      </h1>
      <p className="text-text-muted mb-8">
        VidBridge is required for the best experience when creating highlights, adding live streams, and using YouTube features on this site.
      </p>

      <div className="rounded-xl border border-border bg-panel p-6 space-y-6">
        <h2 className="font-semibold text-text-primary">Step 1: Download</h2>
        {isChromeStore ? (
          <>
            <p className="text-sm text-text-muted mb-4">
              Get VidBridge from the Chrome Web Store. One click to install.
            </p>
            <a
              href={installUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex gap-2 px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90"
            >
              Get VidBridge from Chrome Web Store
            </a>
          </>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-4">
              Click below to download the extension. A guide will open in a new window—arrange it side-by-side with Chrome Extensions to follow along.
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex gap-2 px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90"
            >
              Download Extension
            </button>

            <h2 className="font-semibold text-text-primary">Step 2: Install (Chrome)</h2>
            <ol className="list-decimal list-inside space-y-3 text-text-muted text-sm">
              <li>Extract the downloaded zip file</li>
              <li>Open Chrome and go to <code className="px-1.5 py-0.5 rounded bg-bg text-text-primary">chrome://extensions/</code></li>
              <li>Enable <strong className="text-text-primary">Developer mode</strong> (toggle in top-right)</li>
              <li>Click <strong className="text-text-primary">Load unpacked</strong></li>
              <li>Select the extracted <code className="px-1.5 py-0.5 rounded bg-bg text-text-primary">vidbridge</code> folder</li>
            </ol>
          </>
        )}

        <h2 className="font-semibold text-text-primary">Usage</h2>
        <ul className="list-disc list-inside space-y-2 text-text-muted text-sm">
          <li>Sign in to YouTube in Chrome</li>
          <li>Go to Create Highlight and add 2–8 YouTube URLs</li>
          <li>Click Create Highlight – the extension automatically provides your YouTube session</li>
        </ul>

        <div className="pt-4 flex gap-2">
          <Link
            href="/reels/create/"
            className="inline-block px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90"
          >
            Go to Create Highlight
          </Link>
        </div>
      </div>
    </div>
  )
}
