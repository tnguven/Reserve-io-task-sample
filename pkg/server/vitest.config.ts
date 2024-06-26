import { defineConfig } from "vitest/config";
import { config } from "dotenv";

export default defineConfig({
  test: {
    passWithNoTests: true,
    globals: true,
    coverage: {
      provider: "v8",
      exclude: ["**/tests/**"],
    },
    env: {
      ...config({ path: "./testing.env" }).parsed,
    },
  },
  plugins: [],
});
