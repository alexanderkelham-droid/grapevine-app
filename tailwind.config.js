/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                charcoal: '#121212', // Dark charcoal
                lime: {
                    400: '#a3e635', // Tailwind lime-400
                    500: '#84cc16',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Assuming we might add Inter font, or use system defaults
            }
        },
    },
    plugins: [],
}
