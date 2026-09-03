import { Command, Option } from "commander";
import { createFoldersCommand } from "./commands/folders.js";
import { createForecastCommand } from "./commands/forecast.js";
import { createInboxCommand } from "./commands/inbox.js";
import { createPerspectivesCommand } from "./commands/perspectives.js";
import { createProjectsCommand } from "./commands/projects.js";
import { createSearchCommand } from "./commands/search.js";
import { createStatsCommand } from "./commands/stats.js";
import { createTagsCommand } from "./commands/tags.js";
import { createTasksCommand } from "./commands/tasks.js";

export const program = new Command();

program
  .name("omnifocus")
  .description("CLI for interacting with OmniFocus via Omni Automation")
  .version("0.1.0")
  .addOption(
    new Option("--format <format>", "Output format")
      .choices(["json", "pretty"])
      .default("json"),
  );

program.addCommand(createInboxCommand());
program.addCommand(createProjectsCommand());
program.addCommand(createTasksCommand());
program.addCommand(createTagsCommand());
program.addCommand(createFoldersCommand());
program.addCommand(createSearchCommand());
program.addCommand(createForecastCommand());
program.addCommand(createPerspectivesCommand());
program.addCommand(createStatsCommand());

function collectHelp(cmd: Command, prefix: string): string[] {
  const lines: string[] = [];
  const name = prefix ? `${prefix} ${cmd.name()}` : cmd.name();
  const desc = cmd.description();
  const options = cmd.options
    .map(
      (o) =>
        `    ${o.flags}${o.description ? "  " + o.description : ""}${o.defaultValue !== undefined && o.defaultValue !== false ? " (default: " + JSON.stringify(o.defaultValue) + ")" : ""}`,
    )
    .join("\n");
  const args = cmd.registeredArguments
    .map((a) => `    <${a.name()}>  ${a.description}`)
    .join("\n");

  if (desc || options || args) {
    lines.push(`\n${name}${desc ? " — " + desc : ""}`);
    if (args) lines.push(args);
    if (options) lines.push(options);
  }

  for (const sub of cmd.commands) {
    lines.push(...collectHelp(sub, name));
  }
  return lines;
}

program
  .command("help-all")
  .description("Show all commands and options (useful for AI agents)")
  .action(() => {
    const lines = [
      "omnifocus — CLI for interacting with OmniFocus via Omni Automation",
      "All commands output JSON by default. Use --format pretty for human-readable output.",
      "",
      "Global options:",
      "  --format <json|pretty>  Output format (default: json)",
      ...collectHelp(program, ""),
    ];
    process.stdout.write(lines.join("\n") + "\n");
  });
