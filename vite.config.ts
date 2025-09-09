import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/pigeon-chess/", // repo name, with leading & trailing slash
  build: { outDir: "docs" }, // build into /docs for Pages
  plugins: [react()],
});
