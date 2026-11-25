// Runs Vitest with an upper-case Windows drive letter in the working directory.
// With "c:\..." Vitest can load two copies of its runner and every test fails with
// "Vitest failed to find the current suite". No effect on macOS/Linux.
import { spawnSync } from "node:child_process";

const cwd = process.cwd().replace(/^[a-z]:/, (d) => d.toUpperCase());
const result = spawnSync("npx", ["vitest", ...process.argv.slice(2)], { cwd, stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
