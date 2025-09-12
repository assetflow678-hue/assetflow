'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, QrCode } from 'lucide-react';
import { memo } from 'react';

import { cn } from '@/lib/utils';

const MobileNavComponent = () => {
  const pathname = usePathname();

  const navLinks = [
    {
      href: '/rooms',
      label: 'Trang chủ',
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: '/scan',
      label: 'Quét QR',
      icon: <QrCode className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm z-10 md:hidden">
      <div className="grid h-16 grid-cols-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary',
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

export const MobileNav = memo(MobileNavComponent);
