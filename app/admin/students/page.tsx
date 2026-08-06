'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Loader as Loader2, Mail, Calendar, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Student = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  bio: string;
  location: string;
};

export default function AdminStudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, created_at, bio, location')
        .order('created_at', { ascending: false });
      setStudents((data ?? []) as Student[]);
      setLoading(false);
    })();
  }, []);

  const filtered = students.filter((s) =>
    !search.trim() ||
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Students</h1>
          <p className="mt-1 text-muted-foreground">View and manage all student accounts.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><Users className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{students.length}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><Users className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{students.filter((s) => s.role === 'instructor').length}</p>
            <p className="text-xs text-muted-foreground">Instructors</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white"><Shield className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{students.filter((s) => s.role === 'admin').length}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="pl-9" />
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((student, i) => (
                <motion.div key={student.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {student.avatar_url ? <img src={student.avatar_url} alt={student.full_name} className="h-full w-full rounded-full object-cover" /> : student.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold">{student.full_name || 'Unknown'}</p>
                    <p className="truncate text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{student.email}</p>
                  </div>
                  <Badge variant={student.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{student.role}</Badge>
                  <p className="hidden text-xs text-muted-foreground sm:flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(student.created_at).toLocaleDateString()}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Users className="h-7 w-7" />} title="No students found" description={search ? 'Try a different search.' : 'Students will appear here after they register.'} />
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
