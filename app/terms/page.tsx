import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { useSiteSettings } from '@/lib/contexts/site-settings-context';

const sections = [
  {
    title: 'Acceptance of Terms',
    body: 'By accessing or using this platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.',
  },
  {
    title: 'Use of the Platform',
    body: 'You agree to use the platform only for lawful purposes. You may not share your account, misuse content, or attempt to disrupt services. Course content is licensed for personal, non-commercial use.',
  },
  {
    title: 'Accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.',
  },
  {
    title: 'Courses and Certificates',
    body: 'We strive to keep course content accurate and up to date. Certificates are issued upon successful completion and reflect your participation, but do not constitute formal academic accreditation.',
  },
  {
    title: 'Payments and Refunds',
    body: 'Paid subscriptions are billed in advance. You may cancel anytime. Refunds are available within the first 14 days of a paid plan, minus any processing fees.',
  },
  {
    title: 'Limitation of Liability',
    body: 'This platform is provided "as is". We are not liable for indirect, incidental, or consequential damages arising from your use of the platform.',
  },
];

export default function TermsPage() {
  const { settings } = useSiteSettings();
  const siteName = settings.websiteName || 'Bioinformatics Hub';
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Legal"
          title="Terms of Service"
          description="Last updated: July 31, 2026. Please read these terms carefully."
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
