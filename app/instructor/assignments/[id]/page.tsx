'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader as Loader2, FileText, Award, Clock, Check, X, Star, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import { getAssignment, getSubmissionsByAssignment, gradeSubmission, type Assignment, type Submission } from '@/lib/services/assignment-service';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function InstructorAssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params.id as string;
  const { toast } = useToast();
  const [assignment, setAssignment] = React.useState<Assignment | null>(null);
  const [submissions, setSubmissions] = React.useState<(Submission & { studentName: string; studentEmail: string })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [gradingId, setGradingId] = React.useState<string | null>(null);
  const [grade, setGrade] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [gradeStatus, setGradeStatus] = React.useState<'Reviewed' | 'Approved'>('Approved');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [a, subs] = await Promise.all([
        getAssignment(assignmentId),
        getSubmissionsByAssignment(assignmentId),
      ]);
      setAssignment(a);
      setSubmissions(subs as (Submission & { studentName: string; studentEmail: string })[]);
      setLoading(false);
    })();
  }, [assignmentId]);

  const startGrading = (sub: Submission & { studentName: string; studentEmail: string }) => {
    if (gradingId === sub.id) {
      setGradingId(null);
      return;
    }
    setGradingId(sub.id);
    setGrade(sub.grade !== null ? String(sub.grade) : '');
    setFeedback(sub.feedback ?? '');
    setGradeStatus(sub.status === 'Approved' ? 'Approved' : 'Approved');
  };

  const handleGrade = async (submissionId: string) => {
    const gradeNum = parseInt(grade, 10);
    if (isNaN(gradeNum) || gradeNum < 0) {
      toast({ title: 'Invalid grade', variant: 'destructive' });
      return;
    }
    if (assignment && gradeNum > assignment.maxScore) {
      toast({ title: `Grade cannot exceed max score (${assignment.maxScore})`, variant: 'destructive' });
      return;
    }
    setSaving(true);
    const result = await gradeSubmission(submissionId, gradeNum, feedback.trim(), gradeStatus);
    setSaving(false);
    if (result.success) {
      toast({ title: 'Submission graded' });
      setGradingId(null);
      const subs = await getSubmissionsByAssignment(assignmentId);
      setSubmissions(subs as (Submission & { studentName: string; studentEmail: string })[]);
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

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PageTransition>
    );
  }

  if (!assignment) {
    return (
      <PageTransition>
        <Card className="p-6 shadow-soft">
          <p className="text-center text-muted-foreground">Assignment not found.</p>
          <Button asChild variant="outline" className="mt-4"><Link href="/instructor/assignments">Back to Assignments</Link></Button>
        </Card>
      </PageTransition>
    );
  }

  const pendingCount = submissions.filter((s) => s.status === 'Submitted').length;
  const gradedCount = submissions.filter((s) => s.status === 'Reviewed' || s.status === 'Approved').length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3">
            <Link href="/instructor/assignments"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Assignments</Link>
          </Button>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{assignment.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Award className="h-4 w-4" />Max: {assignment.maxScore}</span>
            {assignment.dueDate && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>}
            <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{submissions.length} submissions</span>
            {pendingCount > 0 && <Badge variant="secondary">{pendingCount} pending review</Badge>}
          </div>
          {assignment.description && <p className="mt-3 text-sm">{assignment.description}</p>}
        </div>

        {submissions.length === 0 ? (
          <Card className="p-12 shadow-soft">
            <div className="text-center text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p>No submissions yet for this assignment.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <Card key={sub.id} className="p-5 shadow-soft">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{sub.studentName}</p>
                      {statusBadge(sub.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{sub.studentEmail}</p>
                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border p-2 text-sm hover:bg-muted transition-colors">
                      <FileText className="h-4 w-4" />{sub.fileName}
                    </a>
                    <p className="text-xs text-muted-foreground">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                    {sub.grade !== null && (
                      <div className="rounded-lg bg-muted/40 p-2 text-sm">
                        <p className="font-semibold">Grade: {sub.grade}/{assignment.maxScore}</p>
                        {sub.feedback && <p className="mt-1 text-muted-foreground">Feedback: {sub.feedback}</p>}
                      </div>
                    )}
                  </div>
                  {sub.status === 'Submitted' && (
                    <Button size="sm" onClick={() => startGrading(sub)}>
                      <Star className="mr-1 h-3.5 w-3.5" />Grade
                    </Button>
                  )}
                  {sub.status !== 'Submitted' && (
                    <Button size="sm" variant="ghost" onClick={() => startGrading(sub)}>Edit Grade</Button>
                  )}
                </div>

                {gradingId === sub.id && (
                  <div className="mt-4 space-y-3 rounded-lg border p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Grade (out of {assignment.maxScore})</Label>
                        <Input type="number" min="0" max={assignment.maxScore} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Enter grade" />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select value={gradeStatus} onChange={(e) => setGradeStatus(e.target.value as 'Reviewed' | 'Approved')} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                          <option value="Approved">Approved</option>
                          <option value="Reviewed">Reviewed (needs revision)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Feedback (optional)</Label>
                      <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Provide feedback to the student..." rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setGradingId(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => handleGrade(sub.id)} disabled={saving}>
                        {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}Save Grade
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
