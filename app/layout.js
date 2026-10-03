// app/layout.js — Root layout with Google Fonts and Providers

import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: {
    default: 'Toto Saathi',
    template: '%s - Toto Saathi',
  },
  description: 'Toto Saathi shuttle ride management between College, Station, and Office.',
  keywords: 'toto saathi, toto, ride, college, station, office, transport',
  openGraph: {
    title: 'Toto Saathi',
    description: 'Toto Saathi shuttle ride management between College, Station, and Office.',
    siteName: 'Toto Saathi',
  },
  twitter: {
    card: 'summary',
    title: 'Toto Saathi',
    description: 'Toto Saathi shuttle ride management between College, Station, and Office.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
