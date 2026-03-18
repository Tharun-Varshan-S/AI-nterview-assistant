interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
  className?: string;
}

export default function DifficultyBadge({ difficulty, className = '' }: DifficultyBadgeProps) {
  const config = {
    easy: {
      light: 'bg-zinc-100 text-zinc-900 border-zinc-200',
      dark: 'dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
      label: 'Easy'
    },
    medium: {
      light: 'bg-zinc-200 text-zinc-900 border-zinc-300',
      dark: 'dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600',
      label: 'Medium'
    },
    hard: {
      light: 'bg-zinc-900 text-white border-transparent',
      dark: 'dark:bg-zinc-100 dark:text-zinc-950 dark:border-transparent',
      label: 'Hard'
    },
  };

  const { light, dark, label } = config[difficulty];

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${light} ${dark} transform transition-transform duration-200 hover:scale-105 ${className}`}>
      {label}
    </span>
  );
}

