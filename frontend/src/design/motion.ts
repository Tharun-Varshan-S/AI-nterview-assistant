import { useEffect, useMemo, useState } from 'react';

export const motionCurve = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export const motionClasses = {
  cardHover:
    'transition-transform transition-shadow duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.01] hover:shadow-convio-card-hover',
  fadeUp: 'animate-fade-up',
  pulseLive: 'animate-soft-pulse',
  glowActive: 'shadow-convio-glow',
  shimmer: 'animate-shimmer',
};

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(media.matches);
    const handler = () => setReduced(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export function useCountUp(target: number, duration = 900, decimals = 0, start = true) {
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) {
      setValue(0);
      return;
    }

    if (reducedMotion) {
      setValue(target);
      return;
    }

    let rafId = 0;
    let startTime = 0;

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);

      if (progress < 1) {
        rafId = window.requestAnimationFrame(animate);
      }
    };

    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, [target, duration, reducedMotion, start]);

  return useMemo(() => Number(value.toFixed(decimals)), [value, decimals]);
}

export function useRafProgress(progress: number, duration = 700) {
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setCurrent(progress);
      return;
    }

    let rafId = 0;
    let startTime = 0;
    const startValue = current;
    const delta = progress - startValue;

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }
      const t = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(startValue + delta * eased);
      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [progress, duration, reducedMotion]);

  return current;
}
