import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['index.html', 'src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        heading: ['Space Grotesk', 'Outfit', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        surface: {
          1: "hsl(var(--surface-1))",
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        convio: {
          neutral: {
            50: '#FAFAFA',
            100: '#F4F4F5',
            200: '#E4E4E7',
            300: '#D4D4D8',
            400: '#A1A1AA',
            500: '#71717A',
            600: '#52525B',
            700: '#3F3F46',
            800: '#27272A',
            900: '#18181B',
            950: '#09090B'
          },
          primary: '#39D4AA',
          secondary: '#3BA2FF',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#F43F5E'
        }
      },
      boxShadow: {
        'convio-card': '0 8px 30px rgba(2, 6, 23, 0.08)',
        'convio-card-hover': '0 14px 38px rgba(2, 6, 23, 0.14)',
        'convio-glow': '0 0 0 1px rgba(57, 212, 170, 0.35), 0 10px 35px rgba(57, 212, 170, 0.24)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        ripple: {
          '0%': { transform: 'translate(-50%, -50%) scale(0.25)', opacity: '0.45' },
          '100%': { transform: 'translate(-50%, -50%) scale(1.6)', opacity: '0' }
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' }
        },
        'bar-grow': {
          '0%': { transform: 'scaleY(0.2)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' }
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'float-in': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        'line-draw': {
          '0%': { strokeDashoffset: '220' },
          '100%': { strokeDashoffset: '0' }
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "count-up": {
          from: { "--num": "0" },
          to: { "--num": "100" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "typewriter": {
          from: { width: "0" },
          to: { width: "100%" },
        },
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        }
      },
      animation: {
        'fade-up': 'fade-up 380ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        ripple: 'ripple 450ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'soft-pulse': 'soft-pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'bar-grow': 'bar-grow 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'slide-in-left': 'slide-in-left 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'float-in': 'float-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'line-draw': 'line-draw 1s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "scan": "scan 2s ease-in-out infinite",
        "blink": "blink 1s step-end infinite",
        "typewriter": "typewriter 2s steps(40) forwards",
        "spin-reverse": "spin-reverse 12s linear infinite"
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px'
      }
    }
  },
  plugins: []
} satisfies Config;


