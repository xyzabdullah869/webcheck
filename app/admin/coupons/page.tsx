'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Trash2, CreditCard as Edit3, Loader as Loader2, Percent, DollarSign, Clock, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PageTransition } from '@/components/page-transition';
import { EmptyState } from '@/components/empty-states';
import { useToast } from '@/hooks/use-toast';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type Coupon,
} from '@/lib/services/coupon-service';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { cn } from '@/lib/utils';

export default function AdminCouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Coupon | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: '' as string | number,
    usageLimit: '' as string | number,
    expiresAt: '',
    isActive: true,
  });
  const [deleteTarget, setDeleteTarget] = React.useState<Coupon | null>(null);

  const loadCoupons = React.useCallback(async () => {
    const data = await getAllCoupons();
    setCoupons(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscountAmount: '',
      usageLimit: '',
      expiresAt: '',
      isActive: true,
    });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (coupon: Coupon) => {
    setForm({
      code: coupon.code,
      description: coupon.description ?? '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount ?? '',
      usageLimit: coupon.usageLimit ?? '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
      isActive: coupon.isActive,
    });
    setEditing(coupon);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      code: form.code.toUpperCase(),
      description: form.description || null,
      discountType: form.discountType,
      discountValue: form.discountValue,
      minOrderAmount: form.minOrderAmount,
      maxDiscountAmount: form.maxDiscountAmount === '' ? null : Number(form.maxDiscountAmount),
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isActive: form.isActive,
    };

    const result = editing
      ? await updateCoupon(editing.id, data)
      : await createCoupon(data as Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>);

    setSaving(false);

    if (result.success) {
      toast({ title: editing ? 'Coupon updated' : 'Coupon created' });
      setShowForm(false);
      resetForm();
      loadCoupons();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteCoupon(id);
    if (result.success) {
      toast({ title: 'Coupon deleted' });
      loadCoupons();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Coupons & Discounts</h1>
            <p className="mt-1 text-muted-foreground">Create and manage discount codes for your students.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Coupon
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : coupons.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon, i) => {
              const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
              const isUsedUp = coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;
              return (
                <motion.div key={coupon.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className={cn('p-5 shadow-soft transition-all hover:shadow-card', (!coupon.isActive || isExpired || isUsedUp) && 'opacity-60')}>
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                        <Tag className="h-5 w-5" />
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(coupon)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(coupon)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 font-display text-lg font-bold tracking-wide">{coupon.code}</p>
                    {coupon.description && <p className="text-xs text-muted-foreground">{coupon.description}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary">
                        {coupon.discountType === 'percentage' ? (
                          <><Percent className="mr-1 h-3 w-3" />{coupon.discountValue}%</>
                        ) : (
                          <><DollarSign className="mr-1 h-3 w-3" />{coupon.discountValue}</>
                        )}
                      </Badge>
                      {coupon.isActive ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      {isExpired && <Badge variant="destructive">Expired</Badge>}
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <p>Used: {coupon.usedCount}{coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : ''}</p>
                      {coupon.expiresAt && (
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                      {coupon.minOrderAmount > 0 && (
                        <p>Min order: ${coupon.minOrderAmount.toFixed(2)}</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 shadow-soft">
            <EmptyState
              icon={<Tag className="h-7 w-7" />}
              title="No coupons yet"
              description="Create discount codes to offer promotions to your students."
              action={{ label: 'Create Coupon', onClick: openCreate }}
            />
          </Card>
        )}

        {/* Form modal */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg"
              >
                <Card className="max-h-[90vh] overflow-y-auto p-6 shadow-float">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
                    <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Coupon Code</Label>
                        <Input
                          value={form.code}
                          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                          placeholder="SAVE20"
                          required
                          disabled={!!editing}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Type</Label>
                        <select
                          value={form.discountType}
                          onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount ($)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="20% off all courses"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{form.discountType === 'percentage' ? 'Discount %' : 'Discount $'}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.discountValue}
                          onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Min Order Amount ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.minOrderAmount}
                          onChange={(e) => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Discount ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.maxDiscountAmount}
                          onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                          placeholder="No limit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Usage Limit</Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.usageLimit}
                          onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                          placeholder="No limit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input
                          type="date"
                          value={form.expiresAt}
                          onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 rounded-xl border p-3">
                          <Switch
                            checked={form.isActive}
                            onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                          />
                          <span className="text-sm font-medium">Active</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {editing ? 'Update Coupon' : 'Create Coupon'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Coupon"
        description={`Are you sure you want to delete coupon "${deleteTarget?.code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); }}
      />
    </PageTransition>
  );
}
