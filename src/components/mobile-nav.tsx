'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';

import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const navLinks = [
    {
      href: '/rooms',
      label: 'Phòng',
      icon: <LayoutGrid className="h-6 w-6" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-card shadow-t-lg">
      <div className="grid h-16 grid-cols-1">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 pt-1 text-sm text-muted-foreground transition-colors hover:text-primary',
                isActive && 'text-primary'
              )}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
