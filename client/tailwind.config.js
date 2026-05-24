/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sage: "#8FAF9B",
        clay: "#DCA78A",
        mist: "#EEF6F3",
        ink: "#26332F",
        rosewater: "#F8E9E2",
        lavender: "#E8E0F4"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(38, 51, 47, 0.08)"
      }
    }
  },
  plugins: []
};
