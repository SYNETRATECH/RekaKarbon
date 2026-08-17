import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dates';

export interface DatePickerProps {
  value?: string; // ISO format string: YYYY-MM-DD
  onChange?: (dateString: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pilih Tanggal',
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? new Date(value) : null;
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date()
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    if (onChange) {
      onChange(dateStr);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 h-10 hover:bg-white hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono',
            !value && 'text-slate-400 font-sans font-semibold',
            className
          )}
        >
          <span>{value ? formatDate(value) : placeholder}</span>
          <CalendarIcon className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        {/* Header navigation */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-black text-slate-800">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 mb-1">
          <span>Min</span>
          <span>Sen</span>
          <span>Sel</span>
          <span>Rab</span>
          <span>Kam</span>
          <span>Jum</span>
          <span>Sab</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isSelected =
              selectedDate &&
              selectedDate.getFullYear() === year &&
              selectedDate.getMonth() === month &&
              selectedDate.getDate() === dayNum;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => handleSelectDay(dayNum)}
                className={cn(
                  'h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer hover:bg-emerald-50 hover:text-emerald-900',
                  isSelected
                    ? 'bg-primary-gradient text-white font-extrabold shadow-xs hover:bg-emerald-700'
                    : 'text-slate-700 font-semibold'
                )}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
