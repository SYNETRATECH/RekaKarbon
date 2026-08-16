interface NDVIGaugeProps {
  value: number;
  label: string;
  trackColorClass: string;
}

export default function NDVIGauge({ value, label, trackColorClass }: NDVIGaugeProps) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - value * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            className="stroke-slate-100 fill-none"
            strokeWidth="5"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            className={`fill-none stroke-[5px] transition-all duration-700 ease-out ${trackColorClass}`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-black text-slate-800">{value.toFixed(2)}</span>
      </div>
      <span className="text-[10px] font-bold text-slate-450 mt-1">{label}</span>
    </div>
  );
}
