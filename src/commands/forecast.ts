import { Command } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import { buildForecastScript } from "../omnifocus/forecast-scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type { ForecastResult } from "../types/omnifocus.js";

export function createForecastCommand(): Command {
  const forecast = new Command("forecast")
    .description("Show forecast of upcoming tasks")
    .action(async (_options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildForecastScript();
      const result = await bridge.executeAndParse<ForecastResult>(script);
      writeOutput(result, globalOpts.format);
    });

  return forecast;
}
