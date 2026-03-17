import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeSync } from '@/components/ThemeSync';
import { ThemeAwareBackground } from '@/components/ThemeAwareBackground';
import { Footer } from '@/components/Footer';
import { RulesBotFab } from '@/components/RulesBotFab';
import { PwaRegister } from '@/components/PwaRegister';
import { basePath } from '@/lib/basePath';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata: Metadata = {
  title: 'ButtonMasherz',
  description: 'ButtonMasherz – Tournaments, reels, matches, clans, and live streams. Create, join, and compete.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  icons: [{ url: basePath ? `${basePath}/buttonmasherz-logo.png` : '/buttonmasherz-logo.png', sizes: 'any', type: 'image/png' }],
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
          <ThemeSync />
          <ThemeAwareBackground />
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
