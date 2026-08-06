'use client';

import { GraduationCap, UserPlus } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { InstructorCard } from '@/components/instructor-card';
import { EmptyState } from '@/components/empty-states';
import { instructors } from '@/lib/data';

export default function InstructorsPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Instructors"
          title="Learn from the best"
          description="PhDs, researchers, and industry leaders who teach what they practice."
        />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {instructors.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {instructors.map((ins, i) => (
                <InstructorCard key={ins.id} instructor={ins} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<GraduationCap className="h-7 w-7" />}
              title="No instructors added yet"
              description="Instructor profiles will appear here once the admin team adds them. Check back soon!"
              action={{ label: 'Become an instructor', href: '/contact' }}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
