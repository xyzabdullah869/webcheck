'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Loader as Loader2, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useAuth } from '@/lib/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

type Certificate = {
  id: string;
  certificate_id: string;
  course_name: string;
  course_id: string;
  score: number;
  issue_date: string;
  verification_url: string;
};

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = React.useState<Certificate[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('certificates')
        .select('id, certificate_id, course_name, course_id, score, issue_date, verification_url')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false });
      setCertificates((data ?? []) as Certificate[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Certificates</h1>
          <p className="mt-1 text-muted-foreground">View and download your earned certificates.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : certificates.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert, i) => (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="group flex h-full flex-col overflow-hidden shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                  <div className="relative flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 p-8 text-white">
                    <Award className="h-16 w-16" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <Badge variant="secondary" className="w-fit">{cert.certificate_id}</Badge>
                    <h3 className="mt-2 font-display text-base font-semibold">{cert.course_name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Issued: {new Date(cert.issue_date).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-600">Score: {cert.score}%</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </Button>
                      {cert.verification_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={cert.verification_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
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
              icon={<Award className="h-7 w-7" />}
              title="No certificates yet"
              description="Complete a course to earn your first certificate. Certificates are issued automatically upon course completion."
              action={{ label: 'Browse Courses', href: '/courses' }}
            />
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
