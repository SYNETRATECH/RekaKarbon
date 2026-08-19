import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
        mint: 'border-transparent bg-[#00C48C]/15 text-[#00C48C] border-[#00C48C]/30',
        warning: 'border-transparent bg-amber-500/10 text-amber-600 border-amber-500/30',
        destructive:
          'border-transparent bg-status-danger-bg text-status-danger-fg border-status-danger-border/30',
        outline: 'border-slate-200 text-slate-600 bg-white',
        secondary: 'border-transparent bg-slate-100 text-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
