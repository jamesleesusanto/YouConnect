import { defineConfig } from "vitest/config";
import { transformWithOxc } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));

/**
 * This project keeps JSX in .js files (AuthContext.js, every src/app/**\/page.js).
 * Next's SWC accepts that; Vite's Oxc transform decides by file extension and
 * does not. This re-parses project .js files as JSX so no source file has to
 * be renamed just to be testable.
 */
const jsxInJsFiles = {
  name: "jsx-in-js-files",
  enforce: "pre",
  async transform(code, id) {
    const [file] = id.split("?");
    if (!file.endsWith(".js") || file.includes("node_modules")) return null;
    if (!code.includes("<")) return null; // cheap skip for plain modules
    return transformWithOxc(code, file, {
      lang: "jsx",
      jsx: { runtime: "automatic" },
    });
  },
};

export default defineConfig({
  plugins: [jsxInJsFiles],
  resolve: {
    // Mirrors the "@/*": ["./*"] alias from jsconfig.json.
    // Vitest does not read jsconfig, so it has to be declared here too.
    alias: { "@": root },
  },
  test: {
    // API route handlers are plain functions - no DOM needed.
    // DOM-based tests opt in per file with: // @vitest-environment jsdom
    environment: "node",
    include: ["tests/**/*.test.{js,jsx}", "lib/**/*.test.js"],
  },
});
