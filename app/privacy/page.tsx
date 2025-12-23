import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Flywheel Coach',
  description: 'Privacy Policy for Flywheel Coach - AI-powered app building platform',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-stone-100 mb-2">Privacy Policy</h1>
        <p className="text-stone-500 mb-8">Last updated: December 23, 2024</p>

        <div className="space-y-8 text-stone-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">1. Introduction</h2>
            <p>
              Flywheel Coach (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard your information when you use
              our AI-powered app building platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-stone-300">Account Information:</strong> When you sign up using Google,
                we receive your email address and profile name from Google.
              </li>
              <li>
                <strong className="text-stone-300">App Building Data:</strong> The problems, ideas, and prompts
                you create while using Flywheel Coach to build applications.
              </li>
              <li>
                <strong className="text-stone-300">API Credentials:</strong> If you choose to connect your own
                Gemini API key, we store it encrypted to enable AI features.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide and maintain the Flywheel Coach service</li>
              <li>To authenticate you and personalize your experience</li>
              <li>To generate AI-powered prompts for building applications</li>
              <li>To improve our service based on usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-stone-300">Google (Authentication):</strong> We use Google OAuth for
                sign-in. Google&apos;s privacy policy applies to the authentication process.
              </li>
              <li>
                <strong className="text-stone-300">Google Gemini API:</strong> We use Google&apos;s Gemini AI to
                generate prompts. Your prompts and app ideas are sent to Gemini for processing.
              </li>
              <li>
                <strong className="text-stone-300">Supabase:</strong> We use Supabase for database and
                authentication services. Data is stored securely in Supabase.
              </li>
              <li>
                <strong className="text-stone-300">Vercel:</strong> Our application is hosted on Vercel.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. API credentials
              are encrypted using AES-256-GCM encryption before storage. All data transmission uses HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. You can request deletion of
              your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">8. Google API Services User Data Policy</h2>
            <p>
              Flywheel Coach&apos;s use and transfer of information received from Google APIs adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:privacy@flywheel-coach.com" className="text-teal-400 hover:text-teal-300">
                privacy@flywheel-coach.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-800">
          <a href="/" className="text-teal-400 hover:text-teal-300">
            ← Back to Flywheel Coach
          </a>
        </div>
      </div>
    </div>
  );
}
