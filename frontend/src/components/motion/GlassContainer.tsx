import { HTMLAttributes, ReactNode } from 'react';

interface GlassContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function GlassContainer({ children, className = '', ...props }: GlassContainerProps) {
  return (
    <div {...props} className={`convio-glass ${className}`}>
      {children}
    </div>
  );
}
