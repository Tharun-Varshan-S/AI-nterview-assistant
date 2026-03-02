interface GlowBadgeProps {
  label: string;
  className?: string;
}

export default function GlowBadge({ label, className = '' }: GlowBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-teal-400/40 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-teal-700 shadow-convio-glow ${className}`}
    >
      {label}
    </span>
  );
}
