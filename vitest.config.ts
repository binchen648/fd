import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/tests/**/*.test.ts", "packages/**/__tests__/**/*.test.ts", "scripts/tests/**/*.test.ts"],
    environment: "node",
    globals: false,
  },
});
