import type { Metadata } from 'next';

import './global.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import { AppProvider } from '@/components/AppProvider';
import { BASE_PATH, SITE_METADATA_BASE } from '@/lib/site';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: SITE_METADATA_BASE,
  title: {
    template: '%s | DayFlow',
    default: 'DayFlow - Lightweight Calendar Component',
  },
  description:
    'A lightweight and elegant full calendar component for React, Vue, Angular, and Svelte. Supports day, week, month, and year views with drag-and-drop, localization, and dark mode.',
  openGraph: {
    type: 'website',
    siteName: 'DayFlow',
    title: {
      template: '%s | DayFlow',
      default: 'DayFlow - Lightweight Calendar Component',
    },
    description:
      'A lightweight and elegant full calendar component for React, Vue, Angular, and Svelte.',
    images: [
      {
        url: `${BASE_PATH}/logo.png`,
        width: 512,
        height: 512,
        alt: 'DayFlow Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      template: '%s | DayFlow',
      default: 'DayFlow - Lightweight Calendar Component',
    },
    description:
      'A lightweight and elegant full calendar component for React, Vue, Angular, and Svelte.',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='en' className={inter.className} suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              src='https://www.googletagmanager.com/gtag/js?id=G-QEXJYTSEME'
              strategy='afterInteractive'
            />
            <Script id='google-analytics' strategy='afterInteractive'>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-QEXJYTSEME');
              `}
            </Script>
          </>
        )}
      </head>
      <body className='flex min-h-screen flex-col'>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
