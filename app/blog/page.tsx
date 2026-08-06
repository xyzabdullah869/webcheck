'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Calendar, Clock } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { blogPosts } from '@/lib/data';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-states';
import { FileText } from 'lucide-react';

const blogCategories = ['All', 'Bioinformatics', 'Programming', 'Data Science', 'Artificial Intelligence', 'Career'];

export default function BlogPage() {
  const [query, setQuery] = React.useState('');
  const [cat, setCat] = React.useState('All');

  const featured = blogPosts[0];

  const filtered = blogPosts.filter((p) => {
    const matchesQuery =
      !query || p.title.toLowerCase().includes(query.toLowerCase()) || p.excerpt.toLowerCase().includes(query.toLowerCase());
    const matchesCat = cat === 'All' || p.category === cat;
    return matchesQuery && matchesCat;
  });

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Blog"
          title="Insights & resources"
          description="Research highlights, tutorials, and career guidance from our community of experts."
        />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Featured */}
          {featured && (
          <Link href={`/blog/${featured.slug}`}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="group grid overflow-hidden shadow-soft transition-shadow hover:shadow-card md:grid-cols-2">
                <div className="relative aspect-video overflow-hidden md:aspect-auto">
                  <Image
                    src={featured.cover}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <Badge className="w-fit" variant="secondary">Featured</Badge>
                  <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="relative h-9 w-9 overflow-hidden rounded-full">
                      <Image src={featured.authorAvatar} alt={featured.author} fill sizes="36px" className="object-cover" />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold">{featured.author}</p>
                      <p className="text-xs text-muted-foreground">{featured.date} • {featured.readTime}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-6 w-fit">
                    Read article
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </Link>
          )}

          {/* Search + categories */}
          {blogPosts.length > 0 && (
          <div className="mt-12 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {blogCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    cat === c ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Grid */}
          {filtered.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Link href={`/blog/${post.slug}`}>
                  <Card className="group flex h-full flex-col overflow-hidden shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <Badge className="absolute left-3 top-3 border-0 bg-background/90 text-foreground backdrop-blur">
                        {post.category}
                      </Badge>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-base font-semibold leading-snug">{post.title}</h3>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                icon={<FileText className="h-7 w-7" />}
                title="No blog posts yet"
                description="Articles and tutorials will appear here once our team starts publishing content."
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
