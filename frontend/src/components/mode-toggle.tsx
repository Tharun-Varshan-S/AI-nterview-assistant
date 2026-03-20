import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ModeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-xl border-[#e5e7eb] bg-[#fafafa] text-[#111827] shadow-none transition-colors duration-300 hover:border-[#d1d5db] hover:bg-[#f4f4f5] dark:border-white/8 dark:bg-[#151515] dark:text-[#e5e7eb] dark:hover:border-white/12 dark:hover:bg-[#181818]"
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun
        className={cn(
          'absolute h-[1.05rem] w-[1.05rem] transition-all duration-300',
          resolvedTheme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        )}
      />
      <Moon
        className={cn(
          'absolute h-[1.05rem] w-[1.05rem] transition-all duration-300',
          resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
