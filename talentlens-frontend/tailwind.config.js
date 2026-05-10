/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A1628",
        surface: "#101C30",
        border: "#1E2D45",
        primary: "#00A8E8",
        accent: "#7B61FF",
        success: "#00875A",
        warning: "#E07B00",
        danger: "#C0392B",
        text: "#E8ECF4",
        muted: "#6B7A99",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,168,232,0.15), 0 12px 40px rgba(0, 30, 60, 0.45)",
        cyan: "0 20px 60px rgba(0,168,232,0.18)",
        purple: "0 20px 60px rgba(123,97,255,0.16)",
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "mesh-glow":
          "radial-gradient(circle at top left, rgba(0,168,232,0.16), transparent 38%), radial-gradient(circle at top right, rgba(123,97,255,0.18), transparent 35%), radial-gradient(circle at bottom center, rgba(0,135,90,0.1), transparent 30%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
