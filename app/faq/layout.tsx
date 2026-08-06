import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'FAQ',
  description: 'Answers to common questions about courses, certificates, pricing, and platform features.',
  path: '/faq',
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
