/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        luxe: {
          black: "#0C0C0C",
          white: "#FFFFFF",

          gold: {
            DEFAULT: "#D4AF37",   // Premium Gold
            soft: "#E5C76E",       // Soft Gold for hover
            dark: "#B38A1E",       // Dark gold for depth
          },

          gray: {
            light: "#F5F5F4",      // stone-light
            medium: "#57534E",     // stone-gray
            dark: "#1F1F1F",       // deep neutral
          }
        },
      },

      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
      },

      boxShadow: {
        gold: "0px 4px 20px rgba(212, 175, 55, 0.25)",
        goldSoft: "0px 2px 15px rgba(229, 199, 110, 0.22)",
      },
    },
  },
  plugins: [],
};
