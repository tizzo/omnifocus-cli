import { Command, Option } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import {
  buildCreateTaskScript,
  buildCompleteTaskScript,
} from "../omnifocus/scripts.js";
import {
  buildListTasksScript,
  buildViewTaskScript,
  buildUpdateTaskScript,
  buildDeleteTaskScript,
  buildMoveTaskScript,
} from "../omnifocus/task-scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type {
  TaskSummary,
  CreateTaskInput,
  TaskListFilters,
  UpdateTaskInput,
} from "../types/omnifocus.js";

export function createTasksCommand(): Command {
  const tasks = new Command("tasks").description("Manage OmniFocus tasks");

  tasks
    .command("create <name>")
    .description("Create a new task")
    .option("--project <name>", "Assign to project")
    .option("--tag <name...>", "Add tags")
    .option("--due <date>", "Due date")
    .option("--defer <date>", "Defer date")
    .option("--note <text>", "Task note")
    .option("--flagged", "Flag the task")
    .action(
      async (
        name: string,
        options: {
          project?: string;
          tag?: string[];
          due?: string;
          defer?: string;
          note?: string;
          flagged?: true;
        },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const input: CreateTaskInput = {
          name,
          project: options.project,
          tags: options.tag,
          dueDate: options.due,
          deferDate: options.defer,
          note: options.note,
          flagged: options.flagged,
        };
        const bridge = new OmniFocusBridge();
        const script = buildCreateTaskScript(input);
        const result = await bridge.executeAndParse<TaskSummary>(script);
        writeOutput(result, globalOpts.format);
      },
    );

  tasks
    .command("complete <id>")
    .description("Mark a task as complete")
    .action(async (id: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildCompleteTaskScript(id);
      const result = await bridge.executeAndParse<TaskSummary>(script);
      writeOutput(result, globalOpts.format);
    });

  tasks
    .command("list")
    .description("List tasks with filters")
    .option("--flagged", "Only flagged tasks")
    .option("--project <name>", "Filter by project name")
    .option("--tag <name>", "Filter by tag name")
    .addOption(
      new Option("--status <status>", "Filter by status").choices([
        "available",
        "completed",
        "blocked",
        "dropped",
        "remaining",
      ]),
    )
    .option("--due-before <date>", "Tasks due before date")
    .option("--due-after <date>", "Tasks due after date")
    .addOption(
      new Option("--sort <field>", "Sort by field").choices([
        "name",
        "due",
        "defer",
        "flagged",
      ]),
    )
    .option("--limit <n>", "Limit number of results", parseInt)
    .option("--count", "Return count only")
    .action(
      async (
        options: {
          flagged?: true;
          project?: string;
          tag?: string;
          status?: "available" | "completed" | "blocked" | "dropped" | "remaining";
          dueBefore?: string;
          dueAfter?: string;
          sort?: "name" | "due" | "defer" | "flagged";
          limit?: number;
          count?: true;
        },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const filters: TaskListFilters = {
          flagged: options.flagged,
          project: options.project,
          tag: options.tag,
          status: options.status,
          dueBefore: options.dueBefore,
          dueAfter: options.dueAfter,
          sort: options.sort,
          limit: options.limit,
          countOnly: options.count,
        };
        const bridge = new OmniFocusBridge();
        const script = buildListTasksScript(filters);
        if (options.count) {
          const result = await bridge.executeAndParse<{ count: number }>(script);
          writeOutput(result, globalOpts.format);
        } else {
          const result = await bridge.executeAndParse<TaskSummary[]>(script);
          writeOutput(result, globalOpts.format);
        }
      },
    );

  tasks
    .command("view <id>")
    .description("View a single task")
    .action(async (id: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildViewTaskScript(id);
      const result = await bridge.executeAndParse<TaskSummary>(script);
      writeOutput(result, globalOpts.format);
    });

  tasks
    .command("update <id>")
    .description("Update a task")
    .option("--name <name>", "New task name")
    .option("--note <text>", "New task note")
    .option("--due <date>", "Set due date")
    .option("--clear-due", "Clear due date")
    .option("--defer <date>", "Set defer date")
    .option("--clear-defer", "Clear defer date")
    .option("--flag", "Flag the task")
    .option("--unflag", "Unflag the task")
    .option("--project <name>", "Move to project")
    .option("--no-project", "Move to inbox")
    .option(
      "--add-tag <name>",
      "Add a tag (repeatable)",
      (val: string, acc: string[]) => {
        acc.push(val);
        return acc;
      },
      [] as string[],
    )
    .option(
      "--remove-tag <name>",
      "Remove a tag (repeatable)",
      (val: string, acc: string[]) => {
        acc.push(val);
        return acc;
      },
      [] as string[],
    )
    .action(
      async (
        id: string,
        options: {
          name?: string;
          note?: string;
          due?: string;
          clearDue?: true;
          defer?: string;
          clearDefer?: true;
          flag?: true;
          unflag?: true;
          project?: string | false;
          addTag: string[];
          removeTag: string[];
        },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const input: UpdateTaskInput = {
          name: options.name,
          note: options.note,
          dueDate: options.clearDue ? null : options.due,
          deferDate: options.clearDefer ? null : options.defer,
          flagged: options.flag ? true : options.unflag ? false : undefined,
          project: options.project === false ? null : options.project,
          addTags: options.addTag.length > 0 ? options.addTag : undefined,
          removeTags: options.removeTag.length > 0 ? options.removeTag : undefined,
        };
        const bridge = new OmniFocusBridge();
        const script = buildUpdateTaskScript(id, input);
        const result = await bridge.executeAndParse<TaskSummary>(script);
        writeOutput(result, globalOpts.format);
      },
    );

  tasks
    .command("delete <id>")
    .description("Delete a task")
    .action(async (id: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildDeleteTaskScript(id);
      const result =
        await bridge.executeAndParse<{ deleted: boolean; id: string; name: string }>(script);
      writeOutput(result, globalOpts.format);
    });

  tasks
    .command("move <id>")
    .description("Move a task to a project")
    .requiredOption("--project <name>", "Target project name")
    .action(
      async (
        id: string,
        options: { project: string },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const bridge = new OmniFocusBridge();
        const script = buildMoveTaskScript(id, options.project);
        const result = await bridge.executeAndParse<TaskSummary>(script);
        writeOutput(result, globalOpts.format);
      },
    );

  return tasks;
}
