import { Replace } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

const LogoComponent = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-lg font-bold text-foreground font-headline',
        className
      )}
    >
      <div className="rounded-lg bg-primary/20 p-2 text-primary">
        <Replace className="h-5 w-5" />
      </div>
      <span>AssetFlow</span>
    </div>
  );
}

export const Logo = memo(LogoComponent);
