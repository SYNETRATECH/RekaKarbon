import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface PageHeaderProps {
  badgeText?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badgeText,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left ${className}`}
    >
      <div>
        {badgeText && (
          <Badge
            variant="outline"
            className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 border-slate-200"
          >
            {badgeText}
          </Badge>
        )}
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">{title}</h2>
        {description && (
          <p className="text-xs text-slate-500 font-semibold mt-1 max-w-3xl">{description}</p>
        )}
      </div>
      {action && <div className="self-start md:self-auto shrink-0">{action}</div>}
    </div>
  );
};
