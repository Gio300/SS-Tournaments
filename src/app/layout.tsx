import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { RulesBotFab } from '@/components/RulesBotFab';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata: Metadata = {
  title: 'smL Tournament Rules Hub',
  description: 'Official smL tournament rules, restrictions, and clarifications. Single source of truth for competitive play.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col relative">
        <div
          className="fixed inset-0 -z-10 bg-app-background"
          aria-hidden
        />
        <Nav />
        <main className="flex-1 relative z-0">{children}</main>
        <RulesBotFab />
        <Footer />
      </body>
    </html>
  );
}
