import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        Privacy Policy
      </h1>
      <p className="text-text-muted mb-8">Last updated: March 2025</p>

      <div className="prose prose-invert max-w-none space-y-6 text-text-muted">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">1. Information We Collect</h2>
          <p>
            ButtonMasherz collects information you provide when you create an account, use our services, or interact with the platform:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Account information: email address, username, and password (hashed)</li>
            <li>Profile information: display name, avatar, bio, game tag (in-game username), and social links</li>
            <li>Match results: screenshots, scores, and match metadata you submit for rankings</li>
            <li>Content: reels, clips, posts, and direct messages</li>
            <li>Usage data: how you interact with the platform (e.g., pages visited, features used)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">2. How We Use Your Information</h2>
          <p>
            We use your information to operate ButtonMasherz, including:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Providing and improving our services (rankings, clans, tournaments, live streams)</li>
            <li>Authenticating your account and verifying your identity</li>
            <li>Displaying your profile, power level, and achievements to other users</li>
            <li>Processing match results and maintaining leaderboards</li>
            <li>Enabling direct messaging and community features</li>
            <li>Communicating with you about your account or platform updates</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">3. Third-Party Services</h2>
          <p>
            We use the following third-party services to operate ButtonMasherz:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Supabase</strong>: Authentication, database, and file storage</li>
            <li><strong>Cloudflare</strong>: AI features (screenshot analysis, rules bot) and hosting</li>
            <li><strong>Meta (Facebook)</strong>: Optional OAuth login</li>
            <li><strong>Google / GitHub</strong>: Optional OAuth login</li>
          </ul>
          <p className="mt-2">
            These services have their own privacy policies. By using ButtonMasherz, you consent to data being processed by these providers as necessary to deliver our services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">4. Cookies and Storage</h2>
          <p>
            We use browser storage (localStorage) for preferences such as theme and text size. We do not use tracking cookies for advertising. Session data is managed by Supabase Auth.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">5. Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data. To delete your account and associated data, contact us at the email below. You may also update your profile and preferences directly in Settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. After account deletion, we remove your data within a reasonable period, except where retention is required by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">7. Contact</h2>
          <p>
            For privacy-related questions or data deletion requests, contact: wavexkoin@gmail.com
          </p>
        </section>
      </div>

      <p className="mt-10 text-center text-text-muted text-sm">
        <Link href="/" className="text-accent hover:underline">Back to Home</Link>
      </p>
    </div>
  );
}
