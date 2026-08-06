import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/sections/hero-section';
import { TrustedBy } from '@/components/sections/trusted-by';
import { StatsSection } from '@/components/sections/stats-section';
import { CategoriesSection } from '@/components/sections/categories-section';
import { FeaturedCourses } from '@/components/sections/featured-courses';
import { WhyChooseUs } from '@/components/sections/why-choose-us';
import { Testimonials } from '@/components/sections/testimonials';
import { FaqSection } from '@/components/sections/faq-section';
import { Newsletter } from '@/components/sections/newsletter';
import { ContactPreview } from '@/components/sections/contact-preview';
import { FeaturesShowcase } from '@/components/sections/features-showcase';
import { BecomeInstructorCta } from '@/components/sections/become-instructor-cta';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TrustedBy />
        <StatsSection />
        <CategoriesSection />
        <FeaturedCourses />
        <WhyChooseUs />
        <FeaturesShowcase />
        <BecomeInstructorCta />
        <Testimonials />
        <FaqSection />
        <Newsletter />
        <ContactPreview />
      </main>
      <Footer />
    </>
  );
}
