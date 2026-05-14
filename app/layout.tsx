import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VendorGuard — Compliance Portal',
  description: 'Enterprise vendor compliance portal: onboard vendors, manage documents, approve with confidence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
