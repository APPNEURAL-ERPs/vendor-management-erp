import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/api/server.ts"],
  format: ["esm"],
  target: "es2022",
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
});
