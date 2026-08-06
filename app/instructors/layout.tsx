import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Instructors',
  description: 'Learn from PhDs, researchers, and industry leaders in bioinformatics and data science.',
  path: '/instructors',
});

export default function InstructorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
