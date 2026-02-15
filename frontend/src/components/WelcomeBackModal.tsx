import { ReactNode } from 'react';

interface Props {
  open: boolean;
  name?: string;
  progressText?: string;
  onContinue: () => void;
  onRestart: () => void;
}

export default function WelcomeBackModal({ open, name, progressText, onContinue, onRestart }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-background rounded border shadow-xl max-w-sm w-full p-4">
        <h3 className="font-semibold text-lg">Welcome back{name? `, ${name}`:''}!</h3>
        <p className="text-sm text-gray-600 mt-1">{progressText}</p>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onRestart} className="px-3 py-2 text-sm rounded border">Start Over</button>
          <button onClick={onContinue} className="px-3 py-2 text-sm rounded bg-blue-600 text-white">Continue Interview</button>
        </div>
      </div>
    </div>
  );
}


