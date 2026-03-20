import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const mono = JetBrains_Mono({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Creator Tip — Support Your Favorite Creators with Crypto',
  description:
    'Send crypto tips directly to your favorite creators — no middleman, no platform fees. Like Saweria or Trakteer, but on the blockchain.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={mono.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
