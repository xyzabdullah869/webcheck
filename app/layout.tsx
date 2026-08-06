import './globals.css';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { SiteSettingsProvider } from '@/lib/contexts/site-settings-context';
import { CartProvider } from '@/lib/contexts/cart-context';
import { AiChatWidget } from '@/components/ai-chat-widget';
import { FloatingHomeButton } from '@/components/floating-home-button';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bioinformaticshub.com'),
  title: 'Bioinformatics Hub — Master Bioinformatics, Data Science & AI',
  description:
    'A premium online learning platform for bioinformatics, biotechnology, AI, programming, and data science. Learn from world-class instructors and earn certificates.',
  keywords: [
    'bioinformatics',
    'online courses',
    'data science',
    'biotechnology',
    'AI',
    'programming',
    'LMS',
  ],
  authors: [{ name: 'Bioinformatics Hub' }],
  openGraph: {
    title: 'Bioinformatics Hub — Master Bioinformatics, Data Science & AI',
    description:
      'A premium online learning platform for bioinformatics, biotechnology, AI, programming, and data science.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SiteSettingsProvider>
            <AuthProvider>
              <CartProvider>
                {children}
                <AiChatWidget />
                <FloatingHomeButton />
              </CartProvider>
            </AuthProvider>
          </SiteSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
