import { Command } from "commander";
import { createInboxCommand } from "./commands/inbox.js";
import { createProjectsCommand } from "./commands/projects.js";
import { createTasksCommand } from "./commands/tasks.js";
import { createTagsCommand } from "./commands/tags.js";
import { createFoldersCommand } from "./commands/folders.js";
import { createSearchCommand } from "./commands/search.js";
import { createForecastCommand } from "./commands/forecast.js";
import { createPerspectivesCommand } from "./commands/perspectives.js";
import { createStatsCommand } from "./commands/stats.js";

export const program = new Command();

program
  .name("omnifocus")
  .description("CLI for interacting with OmniFocus via Omni Automation")
  .version("0.1.0")
  .option("--format <format>", "Output format (json or pretty)", "json");

program.addCommand(createInboxCommand());
program.addCommand(createProjectsCommand());
program.addCommand(createTasksCommand());
program.addCommand(createTagsCommand());
program.addCommand(createFoldersCommand());
program.addCommand(createSearchCommand());
program.addCommand(createForecastCommand());
program.addCommand(createPerspectivesCommand());
program.addCommand(createStatsCommand());
