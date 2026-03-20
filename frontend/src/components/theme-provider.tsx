import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme, storageKey: string) {
  const root = window.document.documentElement;
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
  root.dataset.theme = theme;
  window.localStorage.setItem(storageKey, theme);

  return resolvedTheme;
}

const initialState: ThemeProviderState = {
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }

    const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;
    return storedTheme ?? defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    return (window.document.documentElement.classList.contains('light') ? 'light' : 'dark') as ResolvedTheme;
  });

  useEffect(() => {
    setResolvedTheme(applyTheme(theme, storageKey));
  }, [theme, storageKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY);

    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        setResolvedTheme(applyTheme('system', storageKey));
      }
    };

    handleSystemThemeChange();
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, storageKey]);

  const value = useMemo<ThemeProviderState>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
      },
      toggleTheme: () => {
        setThemeState((currentTheme) => {
          const activeTheme = currentTheme === 'system' ? getSystemTheme() : currentTheme;
          return activeTheme === 'dark' ? 'light' : 'dark';
        });
      },
    }),
    [resolvedTheme, theme]
  );

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
