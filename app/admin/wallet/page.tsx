'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownLeft, ArrowUpRight, Loader as Loader2, Search, DollarSign, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import { adminGetAllWallets, adminWalletOperation, adminGetAllTransactions, type AdminWalletUser } from '@/lib/services/wallet-service';
import { cn } from '@/lib/utils';

export default function AdminWalletPage() {
  const { toast } = useToast();
  const [wallets, setWallets] = React.useState<AdminWalletUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedUser, setSelectedUser] = React.useState<AdminWalletUser | null>(null);
  const [operation, setOperation] = React.useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const w = await adminGetAllWallets();
      setWallets(w);
      setLoading(false);
    })();
  }, []);

  const filtered = wallets.filter((w) => !search.trim() || w.name.toLowerCase().includes(search.toLowerCase()) || w.email.toLowerCase().includes(search.toLowerCase()));

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const handleOperation = async () => {
    if (!selectedUser) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast({ title: 'Invalid amount', variant: 'destructive' }); return; }
    setProcessing(true);
    const result = await adminWalletOperation(selectedUser.userId, operation, amt, description || `Admin ${operation}`, operation);
    setProcessing(false);
    if (result.success) {
      toast({ title: `${operation === 'credit' ? 'Credited' : 'Debited'} $${amt.toFixed(2)}`, description: `New balance: $${result.newBalance?.toFixed(2)}` });
      setAmount(''); setDescription(''); setSelectedUser(null);
      const w = await adminGetAllWallets();
      setWallets(w);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Wallet Management</h1>
          <p className="mt-1 text-muted-foreground">Credit or debit user wallets and view all transactions.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><DollarSign className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">${totalBalance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Balance</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><Users className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{wallets.length}</p>
            <p className="text-xs text-muted-foreground">Active Wallets</p>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white"><Wallet className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{wallets.filter((w) => w.transactionCount > 0).length}</p>
            <p className="text-xs text-muted-foreground">With Transactions</p>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
        </div>

        <Card className="p-6 shadow-soft">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((w, i) => (
                <motion.div key={w.userId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">{w.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold">{w.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{w.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold">${w.balance.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{w.transactionCount} txns</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600" onClick={() => { setSelectedUser(w); setOperation('credit'); }}>
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-rose-200 text-rose-600" onClick={() => { setSelectedUser(w); setOperation('debit'); }}>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Wallet className="h-7 w-7" />} title="No wallets found" description="User wallets will appear here." />
          )}
        </Card>

        {/* Operation modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
            <Card className="w-full max-w-md p-6 shadow-float" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-lg font-bold capitalize">{operation} Wallet</h3>
              <p className="text-sm text-muted-foreground">{selectedUser.name} · Current: ${selectedUser.balance.toFixed(2)}</p>
              <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <Button variant={operation === 'credit' ? 'default' : 'outline'} size="sm" onClick={() => setOperation('credit')} className="flex-1">Credit</Button>
                  <Button variant={operation === 'debit' ? 'default' : 'outline'} size="sm" onClick={() => setOperation('debit')} className="flex-1">Debit</Button>
                </div>
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Reason for adjustment" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleOperation} disabled={processing} className="flex-1">
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirm {operation}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
