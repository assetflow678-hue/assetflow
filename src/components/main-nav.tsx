'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, LayoutGrid } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function MainNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  const navLinks: NavLink[] = [
    {
      href: '/rooms',
      label: 'Phòng',
      icon: <LayoutGrid className="h-5 w-5" />,
    },
    {
      href: '/reports',
      label: 'Báo cáo',
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

  const renderLink = (link: NavLink) => {
    const isActive = pathname.startsWith(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onLinkClick}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
          isActive && 'bg-primary/10 text-primary'
        )}
      >
        {link.icon}
        {link.label}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/">
              <Logo />
            </Link>
        </div>
        <nav className="flex flex-col gap-2 text-base font-medium p-4 pt-0">
            {navLinks.map(renderLink)}
        </nav>
    </div>
  );
}

    