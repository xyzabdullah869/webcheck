'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader as Loader2, Upload, FileText, Award, Calendar, CircleCheck as CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
  getAssignment,
  getMySubmission,
  submitAssignment,
  type Assignment,
  type Submission,
} from '@/lib/services/assignment-service';
import { cn } from '@/lib/utils';

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params.id as string;
  const { toast } = useToast();
  const [assignment, setAssignment] = React.useState<Assignment | null>(null);
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);

  const loadData = React.useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    const [a, sub] = await Promise.all([
      getAssignment(assignmentId),
      getMySubmission(assignmentId, userId),
    ]);
    setAssignment(a);
    setSubmission(sub);
    setLoading(false);
  }, [assignmentId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (assignment) {
      const ext = selected.name.split('.').pop()?.toUpperCase() ?? '';
      if (!assignment.allowedFileTypes.includes(ext)) {
        toast({
          title: 'Invalid file type',
          description: `Allowed: ${assignment.allowedFileTypes.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !assignment) return;

    setUploading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      toast({ title: 'Not authenticated', variant: 'destructive' });
      setUploading(false);
      return;
    }

    const ext = file.name.split('.').pop() ?? '';
    const filePath = `${userId}/${assignmentId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('assignments')
      .getPublicUrl(filePath);

    const result = await submitAssignment({
      assignmentId,
      courseId: assignment.courseId,
      fileName: file.name,
      fileType: ext.toUpperCase(),
      fileUrl: urlData.publicUrl,
    });

    setUploading(false);

    if (result.success) {
      toast({ title: 'Assignment submitted!' });
      setFile(null);
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

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  if (!assignment) {
    return (
      <PageTransition>
        <Card className="p-6 shadow-soft">
          <p className="text-center text-muted-foreground">Assignment not found.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/assignments">Back to Assignments</Link>
          </Button>
        </Card>
      </PageTransition>
    );
  }

  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date() && !submission;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3">
            <Link href="/dashboard/assignments"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Assignments</Link>
          </Button>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{assignment.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Award className="h-4 w-4" />Max: {assignment.maxScore}</span>
            {assignment.dueDate && (
              <span className={cn('flex items-center gap-1', isOverdue && 'text-rose-600')}>
                <Calendar className="h-4 w-4" />
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            )}
            <span>Allowed: {assignment.allowedFileTypes.join(', ')}</span>
          </div>
          {assignment.description && (
            <p className="mt-3 text-sm">{assignment.description}</p>
          )}
        </div>

        {submission && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5 shadow-soft">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2 className="font-display text-lg font-bold">Your Submission</h2>
                {statusBadge(submission.status)}
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <a
                  href={submission.fileUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted"
                >
                  <FileText className="h-4 w-4" />
                  {submission.fileName}
                </a>
                <p className="text-xs text-muted-foreground">
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </p>
                {submission.grade !== null && (
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="font-semibold">Grade: {submission.grade}/{assignment.maxScore}</p>
                    {submission.feedback && <p className="mt-1 text-sm text-muted-foreground">Feedback: {submission.feedback}</p>}
                  </div>
                )}
                {submission.status === 'Submitted' && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> Awaiting review
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {(!submission || submission.status === 'Pending') && !isOverdue && (
          <Card className="p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">Submit Your Work</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Upload File ({assignment.allowedFileTypes.join(', ')})</Label>
                <div className="rounded-xl border-2 border-dashed p-8 text-center">
                  <input
                    type="file"
                    id="assignment-file"
                    accept={assignment.allowedFileTypes.map((t) => `.${t.toLowerCase()}`).join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="assignment-file" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {file ? file.name : 'Click to select a file'}
                    </p>
                  </label>
                </div>
              </div>
              <Button type="submit" disabled={!file || uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Submit Assignment
              </Button>
            </form>
          </Card>
        )}

        {isOverdue && (
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-2 text-rose-600">
              <Clock className="h-5 w-5" />
              <p className="font-semibold">This assignment is overdue.</p>
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
