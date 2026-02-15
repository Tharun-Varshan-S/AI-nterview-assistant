import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

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

  const minutes = Math.floor(timeLeft / 60);
  const seconds_remaining = timeLeft % 60;
  const percentage = (timeLeft / seconds) * 100;

  const getColorClass = () => {
    if (percentage > 50) return 'text-green-600';
    if (percentage > 25) return 'text-yellow-600';
    return 'text-red-600 animate-pulse';
  };

  return (
    <div className="flex items-center gap-2">
      <Clock className={getColorClass()} size={20} />
      <span className={`font-mono text-lg font-semibold ${getColorClass()}`}>
        {minutes.toString().padStart(2, '0')}:{seconds_remaining.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
