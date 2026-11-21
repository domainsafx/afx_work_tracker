import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: ".env.local" });
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/work_tracker_test";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-secret-32-chars-long-placeholder";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
