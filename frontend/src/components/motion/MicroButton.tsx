import { ButtonHTMLAttributes, MouseEvent, useState } from 'react';

interface Ripple {
  x: number;
  y: number;
  id: number;
}

type MicroButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  glow?: boolean;
};

export default function MicroButton({ children, className = '', glow = false, onClick, ...rest }: MicroButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() };
    setRipples((prev) => [...prev, ripple]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 450);
    onClick?.(e);
  };

  return (
    <button
      {...rest}
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-xl px-5 py-2.5 font-medium transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:shadow-convio-card-hover disabled:translate-y-0 disabled:opacity-60 ${
        glow ? 'shadow-convio-glow' : ''
      } ${className}`}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 animate-ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </button>
  );
}
