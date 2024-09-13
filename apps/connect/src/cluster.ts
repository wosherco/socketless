import type { Subprocess } from "bun";
import { spawn } from "bun";

import { env } from "../env";

const cpus = env.CONNECT_CLUSTER_PROCESS_COUNT; // Number of CPU cores
const buns: Subprocess<"inherit", "inherit", "inherit">[] = [];

for (let i = 0; i < cpus; i++) {
  buns.push(
    spawn({
      cmd: ["bun", "./index.ts"],
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
    }),
  );
}

function kill() {
  for (const bun of buns) {
    bun.kill();
  }
}

process.on("SIGINT", kill);
process.on("exit", kill);
