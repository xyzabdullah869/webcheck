'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Star, Flag, Loader as Loader2, Circle as XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { cn } from '@/lib/utils';

type Review = {
  id: string;
  course_id: string;
  course_title: string;
  user_name: string;
  rating: number;
  comment: string;
  flagged: boolean;
  created_at: string;
};

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'flagged'>('all');
  const [deleteTarget, setDeleteTarget] = React.useState<Review | null>(null);

  const loadReviews = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('reviews')
      .select('id, course_id, rating, comment, flagged, created_at, user_id, courses(title)')
      .order('created_at', { ascending: false })
      .limit(50);

    const userIds = Array.from(new Set((data ?? []).map((r: Record<string, unknown>) => r.user_id as string).filter(Boolean)));
    let userMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      (profiles ?? []).forEach((p: Record<string, unknown>) => userMap.set(p.id as string, p.full_name as string));
    }

    const mapped: Review[] = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      course_id: r.course_id as string,
      course_title: ((r.courses as Record<string, unknown>[])?.[0]?.title as string) ?? 'Unknown Course',
      user_name: r.user_id ? userMap.get(r.user_id as string) ?? 'Unknown' : 'Unknown',
      rating: r.rating as number,
      comment: (r.comment as string) ?? '',
      flagged: (r.flagged as boolean) ?? false,
      created_at: r.created_at as string,
    }));
    setReviews(mapped);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const toggleFlag = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from('reviews').update({ flagged: !current }).eq('id', id);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, flagged: !current } : r));
    toast({ title: !current ? 'Review flagged' : 'Review unflagged' });
  };

  const deleteReview = async (id: string) => {
    const supabase = createClient();
    await supabase.from('reviews').delete().eq('id', id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast({ title: 'Review deleted' });
  };

  const filtered = filter === 'flagged' ? reviews.filter((r) => r.flagged) : reviews;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Reviews Moderation</h1>
          <p className="mt-1 text-muted-foreground">Moderate course reviews and flag inappropriate content.</p>
        </div>

        <div className="flex gap-2">
          {(['all', 'flagged'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">
              {f === 'all' ? 'All Reviews' : 'Flagged Only'}
            </Button>
          ))}
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((review, i) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{review.user_name}</p>
                        <div className="flex">{Array.from({ length: review.rating }).map((_, idx) => <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
                        {review.flagged && <Badge variant="destructive"><Flag className="mr-1 h-3 w-3" />Flagged</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{review.course_title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleFlag(review.id, review.flagged)}>
                        {review.flagged ? <XCircle className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(review)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Star className="h-7 w-7" />} title="No reviews found" description={filter === 'flagged' ? 'No flagged reviews to moderate.' : 'Reviews will appear here once students submit them.'} />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Review"
        description="Are you sure you want to delete this review? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) deleteReview(deleteTarget.id); }}
      />
    </PageTransition>
  );
}
