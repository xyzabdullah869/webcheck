'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Loader as Loader2, CircleCheck as CheckCircle2, Clock, Circle as XCircle, ArrowRight, Mail, Phone, BookOpen, Award, Briefcase, Wrench, User, Link as LinkIcon, FileText } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { submitInstructorApplication, getMyApplication, type InstructorApplication } from '@/lib/services/instructor-application-service';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'Under Review', icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

export default function BecomeInstructorPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [application, setApplication] = React.useState<InstructorApplication | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [skillsInput, setSkillsInput] = React.useState('');
  const [form, setForm] = React.useState({
    full_name: '',
    email: '',
    phone: '',
    education: '',
    qualification: '',
    experience: '',
    bio: '',
    portfolio_url: '',
    cv_url: '',
  });

  React.useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
      }));
    }
  }, [profile, user]);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const app = await getMyApplication(user.id);
      setApplication(app);
      setLoading(false);
    })();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: 'Name and email are required', variant: 'destructive' });
      return;
    }

    const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);

    setSubmitting(true);
    const result = await submitInstructorApplication(user.id, {
      ...form,
      skills,
    });
    setSubmitting(false);

    if (result.success) {
      toast({ title: 'Application submitted!', description: 'We will review your application and get back to you soon.' });
      const app = await getMyApplication(user.id);
      setApplication(app);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  if (profile?.role === 'instructor' || profile?.role === 'admin' || profile?.role === 'owner') {
    return (
      <>
        <Navbar />
        <PageTransition>
          <main className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
            <Card className="p-8 text-center shadow-soft">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold">You are already an instructor!</h1>
              <p className="mt-2 text-muted-foreground">You can access the instructor panel to manage your courses.</p>
              <Button asChild className="mt-6">
                <a href="/instructor">
                  Go to Instructor Panel
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </Card>
          </main>
        </PageTransition>
        <Footer />
      </>
    );
  }

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

  if (application && application.status === 'pending') {
    const config = statusConfig.pending;
    const Icon = config.icon;
    return (
      <>
        <Navbar />
        <PageTransition>
          <main className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
            <Card className="overflow-hidden p-0 shadow-card">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center text-white">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <Icon className="h-10 w-10" />
                </motion.div>
                <h1 className="mt-4 font-display text-2xl font-bold">Application Under Review</h1>
                <p className="mt-2 text-sm text-white/80">Your application has been submitted and is being reviewed by our admin team.</p>
              </div>
              <div className="space-y-4 p-6">
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{application.full_name}</p>
                      <p className="text-xs text-muted-foreground">{application.email}</p>
                    </div>
                    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', config.color)}>{config.label}</span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {application.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{application.phone}</p>}
                    {application.qualification && <p className="flex items-center gap-2"><Award className="h-3.5 w-3.5" />{application.qualification}</p>}
                    {application.experience && <p className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" />{application.experience}</p>}
                    {application.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {application.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Submitted on {new Date(application.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-center text-sm text-muted-foreground">You will be notified once your application is reviewed. This typically takes 1-3 business days.</p>
              </div>
            </Card>
          </main>
        </PageTransition>
        <Footer />
      </>
    );
  }

  if (application && application.status === 'rejected') {
    const config = statusConfig.rejected;
    return (
      <>
        <Navbar />
        <PageTransition>
          <main className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
            <Card className="overflow-hidden p-0 shadow-card">
              <div className="bg-gradient-to-r from-rose-500 to-red-500 p-8 text-center text-white">
                <XCircle className="mx-auto h-12 w-12" />
                <h1 className="mt-4 font-display text-2xl font-bold">Application Not Approved</h1>
                <p className="mt-2 text-sm text-white/80">Your application was not approved at this time.</p>
              </div>
              <div className="space-y-4 p-6">
                {application.admin_notes && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900/30 dark:bg-rose-900/10">
                    <p className="font-semibold text-rose-700 dark:text-rose-400">Admin Feedback</p>
                    <p className="mt-1 text-muted-foreground">{application.admin_notes}</p>
                  </div>
                )}
                <p className="text-center text-sm text-muted-foreground">You can submit a new application with updated information.</p>
                <Button onClick={() => setApplication(null)} className="w-full">
                  Submit New Application
                </Button>
              </div>
            </Card>
          </main>
        </PageTransition>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
          <PageHeader
            eyebrow="Become an Instructor"
            title="Join our teaching team"
            description="Share your expertise with thousands of learners. Apply to become an instructor and start creating courses."
          />

          <div className="mt-8">
            <Card className="p-6 shadow-soft sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" className="pl-9" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="pl-9" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Education</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} placeholder="PhD in Bioinformatics" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Qualification</Label>
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="Certified Data Scientist" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="5 years in genomics research" className="pl-9" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Skills (comma-separated)</Label>
                  <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="Python, R, BLAST, NGS, Machine Learning" className="pl-9" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} placeholder="Tell us about yourself, your research, and what you want to teach..." />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Portfolio URL</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://your-portfolio.com" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>CV URL (optional)</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={form.cv_url} onChange={(e) => setForm({ ...form, cv_url: e.target.value })} placeholder="https://... or upload link" className="pl-9" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium">What happens next?</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Our admin team reviews your application</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> If approved, your account is upgraded to instructor</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> You get access to the instructor panel to create courses</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> You keep your student dashboard access too</li>
                  </ul>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Application <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
