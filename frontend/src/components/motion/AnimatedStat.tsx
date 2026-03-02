import { ReactNode } from 'react';
import AnimatedCard from './AnimatedCard';
import CountUpNumber from './CountUpNumber';

interface AnimatedStatProps {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon?: ReactNode;
  deltaLabel?: string;
  className?: string;
}

export default function AnimatedStat({
  label,
  value,
  decimals = 0,
  suffix = '',
  icon,
  deltaLabel,
  className = '',
}: AnimatedStatProps) {
  return (
    <AnimatedCard className={`p-5 ${className}`} glowOnHover>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
          <CountUpNumber
            value={value}
            decimals={decimals}
            suffix={suffix}
            className="mt-2 block text-2xl font-bold text-zinc-950"
          />
          {deltaLabel && <p className="mt-2 text-xs font-medium text-teal-600 animate-fade-up">{deltaLabel}</p>}
        </div>
        {icon && (
          <div className="rounded-xl bg-zinc-900/90 p-3 text-white transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>
    </AnimatedCard>
  );
}
