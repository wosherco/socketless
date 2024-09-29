import { $ } from "bun";

const result = await $`dart analyze`.nothrow();

if (result.exitCode !== 0) {
  throw new Error("Dart analysis failed. Fix the issues and try again.");
}
