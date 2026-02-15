interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = {
    easy: { bg: 'bg-green-100', text: 'text-green-800', label: 'Easy' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
    hard: { bg: 'bg-red-100', text: 'text-red-800', label: 'Hard' },
  };

  const { bg, text, label } = config[difficulty];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}
