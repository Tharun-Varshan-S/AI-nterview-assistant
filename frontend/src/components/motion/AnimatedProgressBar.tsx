import { useRafProgress } from '../../design/motion';

interface AnimatedProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  showGlowTrail?: boolean;
}

export default function AnimatedProgressBar({
  value,
  max = 100,
  className = '',
  trackClassName = '',
  indicatorClassName = '',
  showGlowTrail = false,
}: AnimatedProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const animatedPct = useRafProgress(pct);

  return (
    <div className={`relative h-2.5 overflow-hidden rounded-full bg-zinc-200/90 ${trackClassName} ${className}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-[width] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${indicatorClassName}`}
        style={{ width: `${animatedPct}%` }}
      />
      {showGlowTrail && (
        <div
          className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          style={{ left: `calc(${animatedPct}% - 2rem)` }}
        />
      )}
    </div>
  );
}
