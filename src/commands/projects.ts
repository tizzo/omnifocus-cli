import { Command, Option } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import {
  buildListProjectsScript,
  buildListProjectTasksScript,
} from "../omnifocus/scripts.js";
import {
  buildCreateProjectScript,
  buildViewProjectScript,
  buildDeleteProjectScript,
  buildUpdateProjectScript,
  buildCompleteProjectScript,
  buildUncompleteProjectScript,
} from "../omnifocus/project-scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type {
  CreateProjectInput,
  ProjectFilters,
  ProjectSummary,
  ProjectTaskOptions,
  TaskSummary,
  UpdateProjectInput,
} from "../types/omnifocus.js";

export function createProjectsCommand(): Command {
  const projects = new Command("projects").description(
    "Manage OmniFocus projects",
  );

  projects
    .command("list")
    .description("List all projects")
    .addOption(
      new Option("--status <status>", "Filter by status")
        .choices(["active", "onhold", "all"])
        .default("active"),
    )
    .option("-f, --folder <name>", "Filter by folder name")
    .action(async (options: { status: string; folder?: string }, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const filters: ProjectFilters = {
        status: options.status as ProjectFilters["status"],
        folder: options.folder,
      };
      const bridge = new OmniFocusBridge();
      const script = buildListProjectsScript(filters);
      const projectList =
        await bridge.executeAndParse<ProjectSummary[]>(script);
      writeOutput(projectList, globalOpts.format);
    });

  projects
    .command("tasks <project>")
    .description("List tasks in a project (accepts name or ID)")
    .option("--completed", "Include completed tasks", false)
    .action(
      async (
        project: string,
        options: { completed: boolean },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const taskOptions: ProjectTaskOptions = {
          completed: options.completed,
        };
        const bridge = new OmniFocusBridge();
        const script = buildListProjectTasksScript(project, taskOptions);
        const tasks = await bridge.executeAndParse<TaskSummary[]>(script);
        writeOutput(tasks, globalOpts.format);
      },
    );

  projects
    .command("create <name>")
    .description("Create a new project")
    .option("-f, --folder <name>", "Parent folder name")
    .option("-n, --note <text>", "Project note")
    .option("-d, --due <date>", "Due date")
    .option("--defer <date>", "Defer date")
    .option("--sequential", "Make project sequential", false)
    .addOption(
      new Option("--status <status>", "Project status")
        .choices(["active", "onhold"])
        .default("active"),
    )
    .action(
      async (
        name: string,
        options: {
          folder?: string;
          note?: string;
          due?: string;
          defer?: string;
          sequential: boolean;
          status: string;
        },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const input: CreateProjectInput = {
          name,
          folder: options.folder,
          note: options.note,
          dueDate: options.due,
          deferDate: options.defer,
          sequential: options.sequential || undefined,
          status: options.status as CreateProjectInput["status"],
        };
        const bridge = new OmniFocusBridge();
        const script = buildCreateProjectScript(input);
        const created = await bridge.executeAndParse<ProjectSummary>(script);
        writeOutput(created, globalOpts.format);
      },
    );

  projects
    .command("view <project>")
    .description("View a single project's details (accepts name or ID)")
    .action(async (project: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildViewProjectScript(project);
      const result = await bridge.executeAndParse<ProjectSummary>(script);
      writeOutput(result, globalOpts.format);
    });

  projects
    .command("delete <project>")
    .description("Delete a project (accepts name or ID)")
    .action(async (project: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildDeleteProjectScript(project);
      const result = await bridge.executeAndParse<{ deleted: boolean; id: string; name: string }>(script);
      writeOutput(result, globalOpts.format);
    });

  projects
    .command("update <project>")
    .description("Update a project (accepts name or ID)")
    .option("--name <name>", "New project name")
    .option("--note <text>", "Project note")
    .option("--due <date>", "Due date")
    .option("--clear-due", "Clear due date")
    .option("--defer <date>", "Defer date")
    .option("--clear-defer", "Clear defer date")
    .addOption(
      new Option("--status <status>", "Project status").choices([
        "active",
        "onhold",
        "done",
        "dropped",
      ]),
    )
    .action(
      async (
        project: string,
        options: {
          name?: string;
          note?: string;
          due?: string;
          clearDue?: true;
          defer?: string;
          clearDefer?: true;
          status?: string;
        },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const input: UpdateProjectInput = {
          name: options.name,
          note: options.note,
          dueDate: options.clearDue ? null : options.due,
          deferDate: options.clearDefer ? null : options.defer,
          status: options.status as UpdateProjectInput["status"],
        };
        const bridge = new OmniFocusBridge();
        const script = buildUpdateProjectScript(project, input);
        const updated = await bridge.executeAndParse<ProjectSummary>(script);
        writeOutput(updated, globalOpts.format);
      },
    );

  projects
    .command("complete <project>")
    .description("Mark a project as complete (accepts name or ID)")
    .action(async (project: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildCompleteProjectScript(project);
      const result = await bridge.executeAndParse<ProjectSummary>(script);
      writeOutput(result, globalOpts.format);
    });

  projects
    .command("uncomplete <project>")
    .description("Reopen a completed project (accepts name or ID)")
    .action(async (project: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildUncompleteProjectScript(project);
      const result = await bridge.executeAndParse<ProjectSummary>(script);
      writeOutput(result, globalOpts.format);
    });

  return projects;
}
