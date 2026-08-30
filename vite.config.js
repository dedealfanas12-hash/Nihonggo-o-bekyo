import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base path: works both at a domain root (Vercel/Netlify) and
  // in a GitHub Pages project subdirectory (username.github.io/repo-name/)
  // without needing to hardcode the repo name here. Safe here because the
  // app uses in-memory view state instead of URL-based routing.
  base: "./",
});
