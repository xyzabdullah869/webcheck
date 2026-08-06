import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { useSiteSettings } from '@/lib/contexts/site-settings-context';

const sections = [
  {
    title: 'Information We Collect',
    body: 'We collect information you provide directly to us, such as your name, email address, and payment information when you register for courses. We also automatically collect usage data, device information, and cookies to improve your experience.',
  },
  {
    title: 'How We Use Your Information',
    body: 'We use your information to provide and improve our services, process transactions, send course updates and notifications, personalize content, and communicate with you about your learning progress and new offerings.',
  },
  {
    title: 'Information Sharing',
    body: 'We do not sell your personal information. We may share data with trusted service providers who help us operate the platform (such as payment processors and email providers), all bound by strict confidentiality obligations.',
  },
  {
    title: 'Data Security',
    body: 'We implement industry-standard security measures including encryption, secure servers, and regular audits to protect your data. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: 'Your Rights',
    body: 'You have the right to access, update, or delete your personal information. You can also opt out of marketing communications at any time. Contact us to exercise these rights.',
  },
  {
    title: 'Cookies',
    body: 'We use cookies and similar technologies to remember your preferences, track usage, and improve site functionality. You can control cookies through your browser settings.',
  },
];

export default function PrivacyPage() {
  const { settings } = useSiteSettings();
  const siteName = settings.websiteName || 'Bioinformatics Hub';
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Legal"
          title="Privacy Policy"
          description={`Last updated: July 31, 2026. Your privacy matters to us at ${siteName}.`}
        />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <Card className="space-y-6 p-6 shadow-soft sm:p-8">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="font-display text-lg font-semibold">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
