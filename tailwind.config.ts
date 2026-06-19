import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        'card-hover': "var(--card-hover)",
        elevated: "var(--elevated)",
        border: "var(--border)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        gold: {
          light: '#E8C97A',
          DEFAULT: '#d4a953',
          dark: '#B8903F',
        },
        purple: {
          light: '#A78BFA',
          DEFAULT: '#8B5CF6',
          dark: '#7C3AED',
        },
        gray: {
          400: '#A1A1AA',
          500: '#71717A',
          800: '#3F3F46',
          900: '#27272A',
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-gold": "linear-gradient(90deg, #d4a953 0%, #FDE08B 50%, #d4a953 100%)",
        'gradient-purple': 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
        'gradient-gold-purple': 'linear-gradient(135deg, #d4a953, #8B5CF6)',
      },
      boxShadow: {
        'gold': '0 2px 6px rgba(212, 169, 83, 0.12)',
        'gold-lg': '0 4px 12px rgba(212, 169, 83, 0.18)',
      }
    },
  },
  plugins: [],
}
export default config
