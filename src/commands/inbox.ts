import { Command, Option } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import { buildListInboxScript } from "../omnifocus/scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type { TaskSummary } from "../types/omnifocus.js";

type InboxStatus =
  | "available"
  | "completed"
  | "blocked"
  | "dropped"
  | "remaining"
  | "all";

export function createInboxCommand(): Command {
  const inbox = new Command("inbox").description("Manage OmniFocus inbox");

  inbox
    .command("list")
    .description(
      "List tasks in the OmniFocus inbox (defaults to incomplete only)",
    )
    .addOption(
      new Option(
        "--status <status>",
        "Filter by status (default: remaining)",
      ).choices([
        "available",
        "completed",
        "blocked",
        "dropped",
        "remaining",
        "all",
      ]),
    )
    .action(async (options: { status?: InboxStatus }, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildListInboxScript(options.status);
      const tasks = await bridge.executeAndParse<TaskSummary[]>(script);
      writeOutput(tasks, globalOpts.format);
    });

  return inbox;
}
