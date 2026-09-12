import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: '#17211f', paper: '#f5f3ec', coral: '#ef6d56', moss: '#456b5b', line: '#d9ded5' }, fontFamily: { sans: ['var(--font-sans)'], display: ['var(--font-display)'] } } }, plugins: [] };
export default config;
