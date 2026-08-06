'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Loader as Loader2, Shield, GraduationCap, User, Crown, X, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, updateUserRole } from '@/lib/services/user-management-service';
import { cn } from '@/lib/utils';

const roleConfig: Record<string, { label: string; icon: typeof User; color: string; badge: string }> = {
  student: { label: 'Student', icon: User, color: 'text-blue-600', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  instructor: { label: 'Instructor', icon: GraduationCap, color: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  admin: { label: 'Admin', icon: Shield, color: 'text-violet-600', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  owner: { label: 'Owner', icon: Crown, color: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<{ id: string; full_name: string; email: string; avatar_url: string | null; role: string; created_at: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'student' | 'instructor' | 'admin' | 'owner'>('all');
  const [changingRole, setChangingRole] = React.useState<string | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>('student');

  const loadUsers = React.useCallback(async () => {
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    const result = await updateUserRole(userId, newRole as 'student' | 'instructor' | 'admin' | 'owner');
    setChangingRole(null);
    if (result.success) {
      toast({ title: 'Role updated', description: `User is now a ${newRole}.` });
      loadUsers();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const filtered = users.filter((u) => {
    if (filter !== 'all' && u.role !== filter) return false;
    if (search.trim()) return u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const counts = {
    student: users.filter((u) => u.role === 'student').length,
    instructor: users.filter((u) => u.role === 'instructor').length,
    admin: users.filter((u) => u.role === 'admin').length,
    owner: users.filter((u) => u.role === 'owner').length,
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">User Management</h1>
          <p className="mt-1 text-muted-foreground">Manage user roles and permissions across the platform.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {(['student', 'instructor', 'admin', 'owner'] as const).map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;
            return (
              <Card key={role} className="p-5 shadow-soft">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', config.badge)}><Icon className="h-5 w-5" /></div>
                <p className="mt-3 font-display text-2xl font-bold">{counts[role]}</p>
                <p className="text-xs text-muted-foreground">{config.label}s</p>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'student', 'instructor', 'admin', 'owner'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
            ))}
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
          </div>
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((user, i) => {
                const config = roleConfig[user.role] ?? roleConfig.student;
                const Icon = config.icon;
                return (
                  <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold overflow-hidden">
                      {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" /> : user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold">{user.full_name || 'Unknown'}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', config.badge)}>
                        <Icon className="h-3.5 w-3.5" /> {config.label}
                      </span>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={changingRole === user.id}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Users className="h-7 w-7" />} title="No users found" description={search ? 'Try a different search.' : 'Users will appear here after they register.'} />
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
