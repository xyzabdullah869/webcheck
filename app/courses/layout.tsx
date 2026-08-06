import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Courses',
  description: 'Browse all bioinformatics, data science, and AI courses. Filter by category, level, and price.',
  path: '/courses',
});

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
