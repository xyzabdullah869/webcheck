'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Save, Loader as Loader2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageTransition } from '@/components/page-transition';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

type HeroData = {
  badge: string;
  title: string;
  subtitle: string;
  primary_button_text: string;
  primary_button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  image_url: string | null;
};

export default function AdminHeroPage() {
  const { toast } = useToast();
  const [data, setData] = React.useState<HeroData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: row } = await supabase.from('hero_sections').select('*').eq('id', 1).maybeSingle();
      if (row) setData(row as HeroData);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('hero_sections').update({ ...data, updated_at: new Date().toISOString() }).eq('id', 1);
    setSaving(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Hero section saved', description: 'Homepage hero has been updated.' });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PageTransition>
    );
  }

  const h = data!;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Hero Section</h1>
            <p className="mt-1 text-muted-foreground">Edit the main hero section displayed on your homepage.</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="space-y-5 p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Hero Content</h2>
            </div>

            <div className="space-y-2">
              <Label>Badge Text</Label>
              <Input value={h.badge} onChange={(e) => setData({ ...h, badge: e.target.value })} placeholder="Premium Learning Platform" />
            </div>
            <div className="space-y-2">
              <Label>Main Title</Label>
              <Textarea value={h.title} onChange={(e) => setData({ ...h, title: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea value={h.subtitle} onChange={(e) => setData({ ...h, subtitle: e.target.value })} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Primary Button Text</Label><Input value={h.primary_button_text} onChange={(e) => setData({ ...h, primary_button_text: e.target.value })} /></div>
              <div className="space-y-2"><Label>Primary Button Link</Label><Input value={h.primary_button_link} onChange={(e) => setData({ ...h, primary_button_link: e.target.value })} placeholder="/courses" /></div>
              <div className="space-y-2"><Label>Secondary Button Text</Label><Input value={h.secondary_button_text} onChange={(e) => setData({ ...h, secondary_button_text: e.target.value })} /></div>
              <div className="space-y-2"><Label>Secondary Button Link</Label><Input value={h.secondary_button_link} onChange={(e) => setData({ ...h, secondary_button_link: e.target.value })} placeholder="/instructor" /></div>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={h.image_url ?? ''} onChange={(e) => setData({ ...h, image_url: e.target.value })} placeholder="https://..." />
            </div>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
