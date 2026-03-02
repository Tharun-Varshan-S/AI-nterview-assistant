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

  const tone = useMemo(() => {
    if (ratio > 0.5) {
      return {
        text: 'text-emerald-700',
        ring: '#10B981',
        bg: 'bg-emerald-50',
      };
    }
    if (ratio > 0.2) {
      return {
        text: 'text-amber-700',
        ring: '#F59E0B',
        bg: 'bg-amber-50',
      };
    }
    return {
      text: 'text-rose-700',
      ring: '#F43F5E',
      bg: 'bg-rose-50',
    };
  }, [ratio]);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, ratio)));

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-zinc-200 px-2.5 py-1.5 ${tone.bg} ${timeLeft <= 10 ? 'animate-soft-pulse' : ''}`}>
      <div className={`relative ${timeLeft <= 10 ? 'animate-[shake_450ms_ease-in-out_infinite]' : ''}`}>
        <svg width="42" height="42" viewBox="0 0 42 42" className="-rotate-90">
          <circle cx="21" cy="21" r={radius} stroke="#E4E4E7" strokeWidth="3.5" fill="transparent" />
          <circle
            cx="21"
            cy="21"
            r={radius}
            stroke={tone.ring}
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          />
        </svg>
        <span className={`absolute inset-0 grid place-items-center text-[10px] font-semibold ${tone.text}`}>
          {Math.ceil(ratio * 100)}%
        </span>
      </div>
      <span className={`font-mono text-base font-semibold ${tone.text}`}>
        {minutes.toString().padStart(2, '0')}:{secondsRemaining.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
