import { Children, ReactNode } from 'react';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delayStepMs?: number;
}

export default function StaggerContainer({ children, className = '', delayStepMs = 80 }: StaggerContainerProps) {
  const list = Children.toArray(children);

  return (
    <div className={className}>
      {list.map((child, index) => (
        <div
          key={index}
          className="animate-fade-up"
          style={{ animationDelay: `${index * delayStepMs}ms`, animationFillMode: 'both' }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
