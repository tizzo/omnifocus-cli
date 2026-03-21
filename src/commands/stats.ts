import { Command } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import { buildStatsScript } from "../omnifocus/stats-scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type { StatsResult } from "../types/omnifocus.js";

export function createStatsCommand(): Command {
  const stats = new Command("stats")
    .description("Show OmniFocus database statistics")
    .action(async (_options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildStatsScript();
      const result = await bridge.executeAndParse<StatsResult>(script);
      writeOutput(result, globalOpts.format);
    });

  return stats;
}
