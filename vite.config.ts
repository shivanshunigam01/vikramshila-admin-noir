import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8081,
    strictPort: true,

    // 👇 ALLOW YOUR DOMAIN FOR DEV SERVER
    allowedHosts: ["admin.vikramshilaautomobiles.com"],
  },

  preview: {
    host: "0.0.0.0",
    port: 8081,

    // 👇 ALLOW YOUR DOMAIN FOR PREVIEW SERVER
    allowedHosts: ["admin.vikramshilaautomobiles.com"],
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
