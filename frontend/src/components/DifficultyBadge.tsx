interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
  className?: string;
}

export default function DifficultyBadge({ difficulty, className = '' }: DifficultyBadgeProps) {
  const config = {
    easy: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Easy', ring: 'ring-emerald-200' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Medium', ring: 'ring-amber-200' },
    hard: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Hard', ring: 'ring-rose-200' },
  };

  const { bg, text, label, ring } = config[difficulty];

  return (
    <span className={`inline-flex animate-fade-up items-center rounded-full px-2.5 py-1 text-xs font-semibold ${bg} ${text} ${ring} ring-1 ${className}`}>
      {label}
    </span>
  );
}
