import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Categories',
  description: 'Explore courses by category — bioinformatics, AI, programming, data science, and more.',
  path: '/categories',
});

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
