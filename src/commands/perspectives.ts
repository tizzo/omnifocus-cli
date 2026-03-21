import { Command } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import { buildListPerspectivesScript } from "../omnifocus/perspective-scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type { PerspectiveSummary } from "../types/omnifocus.js";

export function createPerspectivesCommand(): Command {
  const perspectives = new Command("perspectives").description(
    "Manage OmniFocus perspectives",
  );

  perspectives
    .command("list")
    .description("List all perspectives")
    .action(async (_options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildListPerspectivesScript();
      const result =
        await bridge.executeAndParse<PerspectiveSummary[]>(script);
      writeOutput(result, globalOpts.format);
    });

  return perspectives;
}
