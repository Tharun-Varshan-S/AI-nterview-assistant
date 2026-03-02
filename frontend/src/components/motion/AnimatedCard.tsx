import { HTMLAttributes, ReactNode } from 'react';
import { motionClasses } from '../../design/motion';
import GlassContainer from './GlassContainer';

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glowOnHover?: boolean;
}

export default function AnimatedCard({
  children,
  className = '',
  glowOnHover = false,
  ...props
}: AnimatedCardProps) {
  return (
    <GlassContainer
      {...props}
      className={`${motionClasses.cardHover} ${glowOnHover ? 'hover:shadow-convio-glow' : ''} ${className}`}
    >
      {children}
    </GlassContainer>
  );
}
