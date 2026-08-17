import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  filterLabel?: string;
  className?: string;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  filterOptions,
  activeFilter,
  onFilterChange,
  filterLabel = 'Filter:',
  className = '',
}) => {
  return (
    <Card
      className={`rounded-2xl p-4 border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left ${className}`}
    >
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
        />
      </div>

      {filterOptions && onFilterChange && (
        <div className="flex items-center gap-2 flex-wrap">
          {filterLabel && (
            <span className="text-xs font-extrabold text-slate-500">{filterLabel}</span>
          )}
          {filterOptions.map((option) => (
            <Button
              key={option.id}
              variant={activeFilter === option.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onFilterChange(option.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeFilter === option.id
                  ? 'bg-primary-gradient text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};
