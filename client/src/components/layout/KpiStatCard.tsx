import React from 'react';
import { Card } from '@/components/ui/card';

export interface KpiStatCardProps {
  title: string;
  value: React.ReactNode;
  subtext?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  className?: string;
}

export const KpiStatCard: React.FC<KpiStatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  iconBgColor = 'bg-emerald-50',
  iconTextColor = 'text-emerald-600',
  className = '',
}) => {
  return (
    <Card
      className={`rounded-2xl p-5 border-slate-200 shadow-2xs flex flex-row items-center gap-4 text-left ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-2xl ${iconBgColor} ${iconTextColor} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div>
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <div className="text-2xl font-black text-slate-900 mt-0.5">{value}</div>
        {subtext && (
          <span className="text-[10px] font-bold text-slate-400 block mt-0.5">{subtext}</span>
        )}
      </div>
    </Card>
  );
};
