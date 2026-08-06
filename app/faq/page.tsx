import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { FaqSection } from '@/components/sections/faq-section';
import { ContactPreview } from '@/components/sections/contact-preview';

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Help Center"
          title="Frequently asked questions"
          description="Find quick answers to common questions about courses, certificates, pricing, and more."
        />
        <FaqSection />
        <ContactPreview />
      </main>
      <Footer />
    </>
  );
}
