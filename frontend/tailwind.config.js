/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // ✅ 반드시 추가
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
