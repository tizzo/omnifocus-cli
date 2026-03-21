import { Command } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import { buildListInboxScript } from "../omnifocus/scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type { TaskSummary } from "../types/omnifocus.js";

export function createInboxCommand(): Command {
  const inbox = new Command("inbox").description("Manage OmniFocus inbox");

  inbox
    .command("list")
    .description("List tasks in the OmniFocus inbox")
    .action(async (_options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildListInboxScript();
      const tasks = await bridge.executeAndParse<TaskSummary[]>(script);
      writeOutput(tasks, globalOpts.format);
    });

  return inbox;
}
