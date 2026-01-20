import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Linera Dominion - Space MMORTS',
  description: 'Conquer the galaxy in this blockchain-powered MMORTS built on Linera',
  keywords: ['game', 'blockchain', 'linera', 'mmorts', 'space', 'strategy'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-void antialiased">
        <div className="starfield" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
