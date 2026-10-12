/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      colors: {
        // Official Groomish Now Color Palette
        groomish: {
          coral: "#FC6957",
          coralLight: "#FFF0ED",
          slate: "#373A43",
          slateDark: "#23252B",
          slateLight: "#545864",
          gold: "#FED652",
          goldLight: "#FFFBEA",
          goldDark: "#E5BE32",
          cream: "#FAF6ED",
          creamDark: "#F0E9DA",
          green: "#34A955",
          greenLight: "#E8F7ED",
          crimson: "#EA4158",
          crimsonLight: "#FDECEF",
          orange: "#FA7B47",
          orangeLight: "#FFF1EC",
          orangeDark: "#E05E29",
          blue: "#207FBD",
          blueLight: "#E8F4FA",
        },

        // Backward compatibility mappings
        luxe: {
          black: "#373A43",
          white: "#FFFFFF",
          gold: {
            DEFAULT: "#FA7B47",
            soft: "#FC6957",
            dark: "#E05E29",
          },
          gray: {
            light: "#FAF6ED",
            medium: "#7A7E89",
            dark: "#373A43",
          }
        },
      },

      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        heading: ["Outfit", "Plus Jakarta Sans", "sans-serif"],
      },

      boxShadow: {
        soft: "0 4px 20px -2px rgba(55, 58, 67, 0.08)",
        card: "0 10px 30px -5px rgba(55, 58, 67, 0.12)",
        glowOrange: "0 8px 25px -4px rgba(250, 123, 71, 0.35)",
        glowGold: "0 8px 25px -4px rgba(254, 214, 82, 0.4)",
        glowCoral: "0 8px 25px -4px rgba(252, 105, 87, 0.35)",
      },
    },
  },
  plugins: [],
};
