'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Star, Loader as Loader2, Send, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getCourseReviews, submitCourseReview, hasUserReviewed, type CourseReview } from '@/lib/services/review-service';
import { cn } from '@/lib/utils';

export function CourseReviews({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = React.useState<CourseReview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasReviewed, setHasReviewed] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const loadReviews = React.useCallback(async () => {
    const [data, reviewed] = await Promise.all([
      getCourseReviews(courseId),
      user ? hasUserReviewed(courseId, user.id) : Promise.resolve(false),
    ]);
    setReviews(data);
    setHasReviewed(reviewed);
    setLoading(false);
  }, [courseId, user]);

  React.useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!comment.trim()) { toast({ title: 'Please write a comment', variant: 'destructive' }); return; }

    setSubmitting(true);
    const result = await submitCourseReview(courseId, user.id, rating, comment.trim());
    setSubmitting(false);

    if (result.success) {
      toast({ title: 'Review submitted!' });
      setComment('');
      setRating(5);
      setShowForm(false);
      loadReviews();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Student Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('h-4 w-4', i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />)}</div>
            <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {enrolled && !hasReviewed && user && (
        <div className="mt-4">
          {!showForm ? (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <MessageSquare className="mr-2 h-4 w-4" /> Write a Review
            </Button>
          ) : (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-xl border p-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                      <Star className={cn('h-6 w-6 transition-colors', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300')} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comment</Label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Share your experience with this course..." />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Review
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </motion.form>
          )}
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold overflow-hidden">
                    {review.user_avatar ? <img src={review.user_avatar} alt={review.user_name} className="h-full w-full object-cover" /> : review.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{review.user_name}</p>
                      <div className="flex">{Array.from({ length: 5 }).map((_, idx) => <Star key={idx} className={cn('h-3 w-3', idx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />)}</div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<MessageSquare className="h-7 w-7" />} title="No reviews yet" description="Enrolled students can leave reviews after completing lessons." />
        )}
      </div>
    </Card>
  );
}
