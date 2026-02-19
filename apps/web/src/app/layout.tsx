import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Fundi Wangu — Huduma za Fundi Tanzania',
    template: '%s | Fundi Wangu',
  },
  description:
    'Pata Mafundi wa kuaminika Tanzania. Umeme, bomba, rangi, seremala, na zaidi. Huduma za haraka, bei nzuri, Mafundi waliothibitishwa.',
  keywords: [
    'fundi', 'mafundi', 'Tanzania', 'huduma', 'bomba', 'umeme', 'seremala',
    'rangi', 'plumber', 'electrician', 'handyman', 'Dar es Salaam',
  ],
  openGraph: {
    type: 'website',
    locale: 'sw_TZ',
    alternateLocale: 'en_US',
    siteName: 'Fundi Wangu',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
