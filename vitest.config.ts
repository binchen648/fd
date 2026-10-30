import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/tests/**/*.test.ts", "packages/**/__tests__/**/*.test.ts", "scripts/tests/**/*.test.ts"],
    environment: "node",
    globals: false,
    // Full-match simulations and historical proof suites share limited CI CPU.
    // Preserve every test and timeout while avoiding cross-file resource contention.
    fileParallelism: false,
  },
});
