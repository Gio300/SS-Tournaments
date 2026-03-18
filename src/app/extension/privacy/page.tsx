import Link from 'next/link';

export default function ExtensionPrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        VidBridge Extension – Privacy Policy
      </h1>
      <p className="text-text-muted mb-8">Last updated: March 2025</p>

      <div className="prose prose-invert max-w-none space-y-6 text-text-muted">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">1. What VidBridge Accesses</h2>
          <p>
            VidBridge reads your YouTube session cookies only when you click &quot;Create Highlight&quot; on the ButtonMasherz Create Highlight page. No other data is accessed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">2. How Cookies Are Used</h2>
          <p>
            When you create a highlight from YouTube clips, VidBridge converts your YouTube cookies to a format required by the combine service. These cookies are sent in a <strong>single request</strong> to the ButtonMasherz combine API. They are <strong>never stored</strong> by the extension or by ButtonMasherz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">3. No Tracking or Personal Data</h2>
          <p>
            VidBridge does not collect, store, or transmit any personal data. It does not track your browsing. The context menu and popup links only open URLs—they do not send any data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">4. Permissions</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>cookies</strong>: Required to read YouTube cookies for clip combining</li>
            <li><strong>host_permissions (YouTube)</strong>: Required to read YouTube cookies</li>
            <li><strong>host_permissions (ButtonMasherz)</strong>: Required for the content script on Create Highlight</li>
            <li><strong>contextMenus</strong>: Enables right-click &quot;Create highlight from this&quot; on YouTube links</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">5. Main Site Privacy</h2>
          <p>
            For the full ButtonMasherz privacy policy (account, profile, content), see <Link href="/privacy/" className="text-accent hover:underline">Privacy Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">6. Contact</h2>
          <p>
            For the VidBridge extension: wavexkoin@gmail.com
          </p>
        </section>
      </div>

      <p className="mt-10 text-center text-text-muted text-sm">
        <Link href="/" className="text-accent hover:underline">Back to Home</Link>
      </p>
    </div>
  );
}
