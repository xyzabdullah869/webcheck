'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader as Loader2, X, Award, FileText, CircleCheck as CheckCircle2, Circle as XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import {
  getAssignment,
  getSubmissionsByAssignment,
  gradeSubmission,
  type Assignment,
  type SubmissionWithStudent,
} from '@/lib/services/assignment-service';
import { cn } from '@/lib/utils';

export default function AdminAssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params.id as string;
  const { toast } = useToast();
  const [assignment, setAssignment] = React.useState<Assignment | null>(null);
  const [submissions, setSubmissions] = React.useState<SubmissionWithStudent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [gradingId, setGradingId] = React.useState<string | null>(null);
  const [gradeForm, setGradeForm] = React.useState({ grade: 0, feedback: '', status: 'Reviewed' as 'Reviewed' | 'Approved' });
  const [saving, setSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    const [a, subs] = await Promise.all([
      getAssignment(assignmentId),
      getSubmissionsByAssignment(assignmentId),
    ]);
    setAssignment(a);
    setSubmissions(subs);
    setLoading(false);
  }, [assignmentId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const openGrading = (sub: SubmissionWithStudent) => {
    setGradeForm({
      grade: sub.grade ?? 0,
      feedback: sub.feedback ?? '',
      status: sub.status === 'Approved' ? 'Approved' : 'Reviewed',
    });
    setGradingId(sub.id);
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingId) return;
    setSaving(true);
    const result = await gradeSubmission(gradingId, gradeForm.grade, gradeForm.feedback, gradeForm.status);
    setSaving(false);
    if (result.success) {
      toast({ title: 'Submission graded' });
      setGradingId(null);
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      Submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Reviewed: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', colors[status] ?? colors.Pending)}>{status}</span>;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3">
            <Link href="/admin/assignments"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Assignments</Link>
          </Button>
          {assignment && (
            <>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{assignment.title}</h1>
              <p className="mt-1 text-muted-foreground">
                Max score: {assignment.maxScore}
                {assignment.dueDate && ` | Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                {` | ${submissions.length} submissions`}
              </p>
              {assignment.description && <p className="mt-2 text-sm">{assignment.description}</p>}
            </>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : submissions.length > 0 ? (
          <div className="space-y-3">
            {submissions.map((sub, i) => (
              <motion.div key={sub.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-5 shadow-soft">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{sub.studentName ?? 'Unknown Student'}</p>
                        {statusBadge(sub.status)}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{sub.studentEmail}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        <a
                          href={sub.fileUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
                        >
                          <FileText className="h-4 w-4" />
                          {sub.fileName || 'View file'}
                        </a>
                        <span className="text-xs text-muted-foreground">
                          Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {sub.grade !== null && (
                        <div className="mt-3 rounded-lg bg-muted/40 p-3">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            <span className="font-semibold">Grade: {sub.grade}/{assignment?.maxScore ?? 100}</span>
                          </div>
                          {sub.feedback && <p className="mt-1 text-sm text-muted-foreground">{sub.feedback}</p>}
                        </div>
                      )}
                    </div>
                    <div>
                      {sub.status === 'Submitted' || sub.status === 'Pending' ? (
                        <Button size="sm" onClick={() => openGrading(sub)}>
                          <Award className="mr-1 h-3.5 w-3.5" /> Grade
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => openGrading(sub)}>
                          <Award className="mr-1 h-3.5 w-3.5" /> Update Grade
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState
              icon={<FileText className="h-7 w-7" />}
              title="No submissions yet"
              description="Student submissions will appear here for grading."
            />
          </Card>
        )}

        <AnimatePresence>
          {gradingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setGradingId(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <Card className="p-6 shadow-float">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">Grade Submission</h3>
                    <button onClick={() => setGradingId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleGrade} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Score (out of {assignment?.maxScore ?? 100})</Label>
                      <Input
                        type="number"
                        min="0"
                        max={assignment?.maxScore ?? 100}
                        value={gradeForm.grade}
                        onChange={(e) => setGradeForm({ ...gradeForm, grade: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Feedback</Label>
                      <Input
                        value={gradeForm.feedback}
                        onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                        placeholder="Provide feedback for the student"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={gradeForm.status === 'Reviewed' ? 'default' : 'outline'}
                          onClick={() => setGradeForm({ ...gradeForm, status: 'Reviewed' })}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Reviewed
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={gradeForm.status === 'Approved' ? 'default' : 'outline'}
                          onClick={() => setGradeForm({ ...gradeForm, status: 'Approved' })}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approved
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Grade
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setGradingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
