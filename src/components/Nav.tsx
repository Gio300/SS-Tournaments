'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/rules/', label: 'Rules' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/ask/', label: 'Rules Bot' },
  { href: '/community/', label: 'Community' },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-panel/95 backdrop-blur border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        <Link href="/" className="font-display font-bold text-lg text-text-primary hover:text-accent transition">
          smL Rules
        </Link>

        <button
          type="button"
          className="sm:hidden p-2 text-text-primary hover:text-accent"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul
          className={`absolute top-full left-0 right-0 bg-panel border-b border-border sm:border-0 sm:static sm:flex sm:gap-1 ${
            open ? 'block' : 'hidden'
          }`}
        >
          {links.map(({ href, label }) => {
            const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block sm:inline-block px-4 py-3 sm:py-2 sm:px-3 rounded text-sm font-medium transition ${
                    active ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
