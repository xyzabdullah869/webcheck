import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'About',
  description: 'Bioinformatics Hub is a premier online learning platform for computational biology and data science.',
  path: '/about',
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
