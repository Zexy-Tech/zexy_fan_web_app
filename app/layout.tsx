import type { Metadata } from 'next';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config as faConfig } from '@fortawesome/fontawesome-svg-core';
import './globals.css';
import { lato, latoBlack } from './fonts';
import { Providers } from './providers';

// Styles are imported above; stop FA injecting them again at runtime.
faConfig.autoAddCss = false;

export const metadata: Metadata = {
  title: 'Zexy - Support Your Favorite Creators',
  description: 'Exclusive content, live sessions, and direct connection with creators',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lato.variable} ${latoBlack.variable}`} suppressHydrationWarning>
      <body
        className={`${lato.className} bg-background text-foreground antialiased`}
        style={{
          margin: 0,
          minHeight: '100vh',
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
