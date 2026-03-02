export const theme = {
  color: {
    neutral: {
      950: '#09090B',
      900: '#18181B',
      800: '#27272A',
      700: '#3F3F46',
      600: '#52525B',
      500: '#71717A',
      400: '#A1A1AA',
      300: '#D4D4D8',
      200: '#E4E4E7',
      100: '#F4F4F5',
      50: '#FAFAFA',
    },
    primary: '#39D4AA',
    secondary: '#3BA2FF',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#F43F5E',
  },
  shadow: {
    card: '0 8px 30px rgba(2, 6, 23, 0.08)',
    cardHover: '0 14px 38px rgba(2, 6, 23, 0.14)',
    glowPrimary: '0 0 0 1px rgba(57, 212, 170, 0.35), 0 10px 35px rgba(57, 212, 170, 0.24)',
  },
  radius: {
    lg: '14px',
    xl: '18px',
    xxl: '22px',
  },
  motion: {
    fast: '180ms',
    normal: '260ms',
    slow: '420ms',
    curve: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
} as const;

export type Theme = typeof theme;
