import type { Config } from "tailwindcss";
import { TYPOGRAPHY_TOKENS } from "../../packages/ui/src/tokens/typography";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ["class"],
    theme: {
        extend: {
            fontFamily: TYPOGRAPHY_TOKENS.fontFamily,
            fontSize: TYPOGRAPHY_TOKENS.fontSize,
            fontWeight: TYPOGRAPHY_TOKENS.fontWeight,
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                'foreground-secondary': 'hsl(var(--foreground-secondary))',
                'foreground-tertiary': 'hsl(var(--foreground-tertiary))',
                'foreground-subtle': 'hsl(var(--foreground-subtle))',
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                sidebar: {
                    DEFAULT: "#1e293b", // slate-800
                    foreground: "#f8fafc", // slate-50
                },
                primary: {
                    DEFAULT: "#3b82f6", // blue-500
                    foreground: "#ffffff",
                }
            },
            keyframes: {
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-4px)' },
                    '50%': { transform: 'translateX(4px)' },
                    '75%': { transform: 'translateX(-4px)' },
                }
            }
        },
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
