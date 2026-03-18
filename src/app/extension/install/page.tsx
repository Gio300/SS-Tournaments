import Link from 'next/link'

export default function ExtensionInstallPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        Install ButtonMasherz Extension
      </h1>
      <p className="text-text-muted mb-8">
        The ButtonMasherz Extension is required for the best experience when creating highlights, adding live streams, and using YouTube features on this site.
      </p>

      <div className="rounded-xl border border-border bg-panel p-6 space-y-6">
        <h2 className="font-semibold text-text-primary">Install (Chrome)</h2>
        <ol className="list-decimal list-inside space-y-3 text-text-muted text-sm">
          <li>Open Chrome and go to <code className="px-1.5 py-0.5 rounded bg-bg text-text-primary">chrome://extensions/</code></li>
          <li>Enable <strong className="text-text-primary">Developer mode</strong> (toggle in top-right)</li>
          <li>Click <strong className="text-text-primary">Load unpacked</strong></li>
          <li>Select the <code className="px-1.5 py-0.5 rounded bg-bg text-text-primary">buttonmasherz-extension</code> folder from the ButtonMasherz repo</li>
        </ol>

        <p className="text-sm text-text-muted">
          If you have the extension as a zip file, extract it first, then select the extracted folder.
        </p>

        <h2 className="font-semibold text-text-primary">Usage</h2>
        <ul className="list-disc list-inside space-y-2 text-text-muted text-sm">
          <li>Sign in to YouTube in Chrome</li>
          <li>Go to Create Highlight and add 2–8 YouTube URLs</li>
          <li>Click Create Highlight – the extension automatically provides your YouTube session</li>
        </ul>

        <div className="pt-4">
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
