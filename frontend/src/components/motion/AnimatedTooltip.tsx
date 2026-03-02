import { ReactNode } from 'react';

interface AnimatedTooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function AnimatedTooltip({ content, children, className = '' }: AnimatedTooltipProps) {
  return (
    <div className={`group relative inline-flex ${className}`}>
      {children}
      <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-max -translate-x-1/2 rounded-lg border border-zinc-200 bg-white/95 px-3 py-1.5 text-xs text-zinc-700 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100">
        {content}
      </div>
    </div>
  );
}
