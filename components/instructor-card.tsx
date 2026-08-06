'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Users, BookOpen, Twitter, Linkedin, Github, Globe } from 'lucide-react';
import type { Instructor } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function InstructorCard({ instructor, index = 0 }: { instructor: Instructor; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={instructor.avatar}
          alt={instructor.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-display text-lg font-bold text-white">{instructor.name}</h3>
          <p className="text-sm text-white/80">{instructor.title}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">{instructor.bio}</p>

        {/* Skills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {instructor.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="secondary" className="font-normal">
              {skill}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 font-display text-sm font-bold">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {instructor.rating}
            </div>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 font-display text-sm font-bold">
              <Users className="h-3.5 w-3.5 text-primary" />
              {(instructor.students / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground">Students</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 font-display text-sm font-bold">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              {instructor.courses}
            </div>
            <p className="text-xs text-muted-foreground">Courses</p>
          </div>
        </div>

        {/* Social + CTA */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {instructor.social.twitter && (
              <a href={instructor.social.twitter} aria-label="Twitter" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {instructor.social.linkedin && (
              <a href={instructor.social.linkedin} aria-label="LinkedIn" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {instructor.social.github && (
              <a href={instructor.social.github} aria-label="GitHub" className="text-muted-foreground hover:text-primary">
                <Github className="h-4 w-4" />
              </a>
            )}
            {instructor.social.website && (
              <a href={instructor.social.website} aria-label="Website" className="text-muted-foreground hover:text-primary">
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/instructors/${instructor.id}`}>View Profile</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
