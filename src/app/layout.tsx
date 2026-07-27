import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TRACE — Digital Investigation System',
  description: 'AI-powered digital investigation and evidence analysis platform. Follow the evidence. Uncover the connections.',
  keywords: ['digital investigation', 'evidence analysis', 'forensics', 'AI analysis', 'OSINT'],
  authors: [{ name: 'TRACE Intelligence Platform' }],
  robots: 'noindex, nofollow', // Investigation tool — not for indexing
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
