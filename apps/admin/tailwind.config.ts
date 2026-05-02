import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                sidebar: {
                    DEFAULT: "#1e293b", // slate-800
                    foreground: "#f8fafc", // slate-50
                },
                primary: {
                    DEFAULT: "#3b82f6", // blue-500
                    foreground: "#ffffff",
                }
            },
        },
    },
    plugins: [],
};
export default config;
