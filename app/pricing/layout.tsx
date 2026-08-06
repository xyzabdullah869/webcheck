import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Pricing',
  description: 'Choose the plan that fits your learning goals — Free, Pro, or Premium with mentorship.',
  path: '/pricing',
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
