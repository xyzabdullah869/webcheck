import { Target, Eye, Heart, Users, BookOpen, Globe as Globe2, Sparkles, Compass, HandHeart } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { SectionTitle } from '@/components/section-title';
import { StatsSection } from '@/components/sections/stats-section';
import { Testimonials } from '@/components/sections/testimonials';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-states';
import { GraduationCap } from 'lucide-react';
import { instructors } from '@/lib/data';
import { useSiteSettings } from '@/lib/contexts/site-settings-context';

const values = [
  {
    icon: Target,
    title: 'Our Mission',
    description:
      'Make world-class bioinformatics education accessible to every curious mind, everywhere — regardless of background or geography.',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    description:
      'A global community where biology and code meet to solve humanity\u2019s biggest challenges, from disease to climate.',
  },
  {
    icon: Heart,
    title: 'Our Values',
    description:
      'Curiosity, rigor, accessibility, and lifelong learning guide every course we build and every learner we serve.',
  },
];

const communityPillars = [
  {
    icon: Users,
    title: 'Global Community',
    description: 'Connect with learners and researchers from around the world in forums, study groups, and live events.',
  },
  {
    icon: BookOpen,
    title: 'Open Knowledge',
    description: 'We believe knowledge should be shared freely. Our free tier gives everyone a starting point.',
  },
  {
    icon: Globe2,
    title: 'Diverse Perspectives',
    description: 'Courses from instructors across academia, industry, and research bring real-world diversity.',
  },
  {
    icon: Sparkles,
    title: 'Continuous Growth',
    description: 'Learning never stops. We update courses regularly and add new content as science evolves.',
  },
  {
    icon: Compass,
    title: 'Guided Paths',
    description: 'Follow structured learning tracks designed to take you from beginner to job-ready.',
  },
  {
    icon: HandHeart,
    title: 'Mentorship',
    description: 'Premium members get 1-on-1 guidance from experts who have walked the path before.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="About Us"
          title="Empowering the next generation of scientists"
          description="We bridge biology and technology through premium, accessible education — built by researchers, for the curious."
        />

        {/* Story */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border shadow-float">
                <img
                  src="https://images.pexels.com/photos/8442110/pexels-photo-8442110.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Researchers in a laboratory"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <SectionTitle
                  center={false}
                  eyebrow="Our Story"
                  title="From a research lab to a global learning platform"
                  description="Bioinformatics Hub started when a group of computational biologists noticed a gap: brilliant people eager to learn, but few resources that taught biology and programming together."
                />
                <p className="mt-4 text-muted-foreground">
                  We set out to build a platform where science meets code — where
                  anyone with curiosity could learn the tools shaping modern biology.
                  Every course is crafted by experts who work in the field, so what
                  you learn reflects how science is actually done.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-muted/20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="What drives us" title="Mission, vision & values" />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {values.map((v) => (
                <Card key={v.title} className="p-6 shadow-soft">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <v.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <StatsSection />

        {/* Community */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Community"
              title="More than courses — a movement"
              description="We are building a global community of learners, researchers, and innovators who believe science should be open to all."
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {communityPillars.map((pillar) => (
                <Card key={pillar.title} className="group p-6 shadow-soft transition-shadow hover:shadow-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-primary transition-transform group-hover:scale-110">
                    <pillar.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold">{pillar.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{pillar.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Instructors preview */}
        <section className="bg-muted/20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Our Team"
              title="Meet the instructors"
              description="Experts who teach what they practice."
            />
            {instructors.length > 0 ? (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {instructors.slice(0, 3).map((ins, i) => (
                  <InstructorCardLazy key={ins.id} instructor={ins} index={i} />
                ))}
              </div>
            ) : (
              <div className="mt-12">
                <EmptyState
                  icon={<GraduationCap className="h-7 w-7" />}
                  title="No instructors have been added yet"
                  description="Our team is recruiting expert instructors. Instructor profiles will appear here once they join the platform."
                  action={{ label: 'Become an instructor', href: '/contact' }}
                />
              </div>
            )}
          </div>
        </section>

        <Testimonials />
      </main>
      <Footer />
    </>
  );
}

import { InstructorCard } from '@/components/instructor-card';
import type { Instructor } from '@/lib/types';

function InstructorCardLazy({ instructor, index }: { instructor: Instructor; index: number }) {
  return <InstructorCard instructor={instructor} index={index} />;
}
