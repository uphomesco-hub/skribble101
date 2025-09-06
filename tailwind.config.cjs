/** @type {import('tailwindcss').Config} */
module.exports = {
content: ['./index.html', './src/**/*.{ts,tsx}'],
theme: { extend: { boxShadow: { soft: '0 6px 20px rgba(0,0,0,0.08)' } } },
plugins: [],
}