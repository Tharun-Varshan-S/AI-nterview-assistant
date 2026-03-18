import { useEffect, useMemo, useState } from 'react';

interface CountdownTimerProps {
  seconds: number;
  onTimeout: () => void;
}

export default function CountdownTimer({ seconds, onTimeout }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeout]);

  const ratio = timeLeft / seconds;
  const minutes = Math.floor(timeLeft / 60);
  const secondsRemaining = timeLeft % 60;

  const config = useMemo(() => {
    if (ratio > 0.3) {
      return {
        text: 'text-zinc-600 dark:text-zinc-400',
        ring: 'currentColor',
        bg: 'bg-zinc-100/50 dark:bg-zinc-800/50',
        urgent: false
      };
    }
    return {
      text: 'text-rose-600 dark:text-rose-400',
      ring: 'currentColor',
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      urgent: true
    };
  }, [ratio]);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, ratio)));

  return (
    <div className={`inline-flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 transition-all duration-300 ${config.bg}`}>
      <div className={`relative flex items-center justify-center ${config.urgent && timeLeft <= 10 ? 'animate-[shake_0.5s_infinite]' : ''}`}>
        <svg width="36" height="36" viewBox="0 0 42 42" className="-rotate-90">
          <circle cx="21" cy="21" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-200 dark:text-zinc-800" />
          <circle
            cx="21"
            cy="21"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={`transition-[stroke-dashoffset] duration-700 ease-in-out ${config.text}`}
          />
        </svg>
        <span className={`absolute text-[9px] font-bold lining-nums ${config.text}`}>
          {Math.ceil(ratio * 100)}
        </span>
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Time Left</span>
        <span className={`font-heading text-lg font-bold lining-nums ${config.text} tabular-nums`}>
          {minutes.toString().padStart(2, '0')}:{secondsRemaining.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

