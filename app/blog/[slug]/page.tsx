'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Loader as Loader2, FileText } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-states';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        <PageHeader eyebrow="Blog" title="Article not found" description="This blog post may not exist or has been removed." />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title="Post not found"
            description="This blog post may not exist or has been removed."
            action={{ label: 'Back to Blog', href: '/blog' }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
