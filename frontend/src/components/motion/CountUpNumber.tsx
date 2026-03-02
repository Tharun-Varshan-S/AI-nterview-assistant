import { useCountUp } from '../../design/motion';

interface CountUpNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export default function CountUpNumber({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 900,
  className = '',
}: CountUpNumberProps) {
  const animated = useCountUp(value, duration, decimals, true);

  return <span className={className}>{`${prefix}${animated.toFixed(decimals)}${suffix}`}</span>;
}
