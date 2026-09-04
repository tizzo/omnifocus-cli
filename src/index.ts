import { program } from "./cli.js";
import { formatErrorOutput } from "./errors.js";

program.parseAsync(process.argv).catch((error: unknown) => {
  process.stderr.write(`${formatErrorOutput(error)}\n`);
  process.exit(1);
});
