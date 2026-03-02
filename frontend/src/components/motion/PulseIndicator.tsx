interface PulseIndicatorProps {
  label?: string;
  className?: string;
}

export default function PulseIndicator({ label = 'Live', className = '' }: PulseIndicatorProps) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-emerald-700 ${className}`}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  );
}
