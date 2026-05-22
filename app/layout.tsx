import * as Sentry from '@sentry/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zexy - Support Your Favorite Creators',
  description: 'Exclusive content, live sessions, and direct connection with creators',
  other: {
    ...Sentry.getTraceData()
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      {/* Inline fallback so the shell isn’t stark white if CSS chunks fail to load (network / cache). */}
      <body
        className={inter.className}
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: 'hsl(240 10% 3.9%)',
          color: 'hsl(0 0% 98%)',
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
