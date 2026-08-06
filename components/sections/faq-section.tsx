'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Plus, CircleHelp as HelpCircle } from 'lucide-react';
import { faqs as staticFaqs } from '@/lib/data';
import { SectionTitle } from '@/components/section-title';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { EmptyState } from '@/components/empty-states';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function FaqSection() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('faqs')
        .select('id, question, answer')
        .eq('published', true)
        .order('sort_order', { ascending: true });

      if (data && data.length > 0) {
        setItems(data as FaqItem[]);
      } else {
        setItems(staticFaqs);
      }
      setLoading(false);
    })();
  }, []);

  if (!loading && items.length === 0) {
    return (
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="FAQ"
            title="Frequently asked questions"
            description="Everything you need to know about courses, certificates, and pricing."
          />
          <div className="mt-10">
            <Card className="p-6 shadow-soft">
              <EmptyState
                icon={<HelpCircle className="h-7 w-7" />}
                title="No FAQs available"
                description="Frequently asked questions will appear here once they are added by the admin."
              />
            </Card>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="FAQ"
          title="Frequently asked questions"
          description="Everything you need to know about courses, certificates, and pricing."
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="rounded-xl border bg-card px-5 shadow-soft transition-shadow data-[state=open]:shadow-card"
              >
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
