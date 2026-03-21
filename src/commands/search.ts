import { Command } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import { buildSearchScript } from "../omnifocus/task-scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type { TaskSummary, SearchOptions } from "../types/omnifocus.js";

export function createSearchCommand(): Command {
  const search = new Command("search")
    .description("Search tasks by name or note")
    .argument("<query>", "Search query")
    .option("--include-completed", "Include completed tasks")
    .option("--project <name>", "Filter by project name")
    .option("--tag <name>", "Filter by tag name")
    .option("--limit <n>", "Limit number of results", parseInt)
    .action(
      async (
        query: string,
        options: {
          includeCompleted?: true;
          project?: string;
          tag?: string;
          limit?: number;
        },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const searchOptions: SearchOptions = {
          includeCompleted: options.includeCompleted,
          project: options.project,
          tag: options.tag,
          limit: options.limit,
        };
        const bridge = new OmniFocusBridge();
        const script = buildSearchScript(query, searchOptions);
        const result = await bridge.executeAndParse<TaskSummary[]>(script);
        writeOutput(result, globalOpts.format);
      },
    );

  return search;
}
