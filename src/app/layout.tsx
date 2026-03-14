import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Footer } from '@/components/Footer';
import { RulesBotFab } from '@/components/RulesBotFab';
import { PwaRegister } from '@/components/PwaRegister';
import { basePath } from '@/lib/basePath';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

const bgImageUrl = basePath
  ? `linear-gradient(180deg, #0B0E14 0%, rgba(11,14,20,0.85) 40%, rgba(11,14,20,0.9) 100%), url('${basePath}/bg-pattern.png.svg')`
  : undefined;

export const metadata: Metadata = {
  title: 'SmashHub',
  description: 'SmashHub – Tournaments, reels, matches, clans, and live streams. Create, join, and compete.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  icons: [{ url: basePath ? `${basePath}/favicon.svg` : '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      {adsenseClient && (
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
          strategy="lazyOnload"
          data-ad-client={adsenseClient}
        />
      )}
      <body className="font-sans antialiased min-h-screen flex flex-col relative">
        <ThemeProvider>
        <div
          className="fixed inset-0 -z-10 bg-app-background"
          style={bgImageUrl ? { backgroundImage: bgImageUrl } : undefined}
            aria-hidden
          />
          <PwaRegister />
          <Nav />
          <main className="flex-1 relative z-0">{children}</main>
          <RulesBotFab />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
