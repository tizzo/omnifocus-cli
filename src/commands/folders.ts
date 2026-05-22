import { Command, Option } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import {
  buildCreateFolderScript,
  buildDeleteFolderScript,
  buildListFoldersScript,
  buildUpdateFolderScript,
  buildViewFolderScript,
} from "../omnifocus/folder-scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type {
  CreateFolderInput,
  DeleteResult,
  FolderDetail,
  FolderSummary,
  UpdateFolderInput,
} from "../types/omnifocus.js";

export function createFoldersCommand(): Command {
  const folders = new Command("folders").description(
    "Manage OmniFocus folders",
  );

  folders
    .command("list")
    .description("List all folders")
    .action(async (_options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildListFoldersScript();
      const folderList =
        await bridge.executeAndParse<FolderSummary[]>(script);
      writeOutput(folderList, globalOpts.format);
    });

  folders
    .command("view <folder>")
    .description("View a folder's contents (projects and subfolders)")
    .action(async (folder: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildViewFolderScript(folder);
      const result = await bridge.executeAndParse<FolderDetail>(script);
      writeOutput(result, globalOpts.format);
    });

  folders
    .command("create <name>")
    .description("Create a new folder")
    .option("-p, --parent <name>", "Parent folder name or ID")
    .action(
      async (
        name: string,
        options: { parent?: string },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const input: CreateFolderInput = {
          name,
          parent: options.parent,
        };
        const bridge = new OmniFocusBridge();
        const script = buildCreateFolderScript(input);
        const created = await bridge.executeAndParse<FolderSummary>(script);
        writeOutput(created, globalOpts.format);
      },
    );

  folders
    .command("delete <folder>")
    .description("Delete a folder (accepts name or ID)")
    .action(async (folder: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildDeleteFolderScript(folder);
      const result = await bridge.executeAndParse<DeleteResult>(script);
      writeOutput(result, globalOpts.format);
    });

  folders
    .command("update <folder>")
    .description("Update a folder (accepts name or ID)")
    .option("--name <name>", "Rename the folder")
    .addOption(
      new Option("--status <status>", "Folder status").choices([
        "active",
        "dropped",
      ]),
    )
    .option("-p, --parent <name>", "Move under a parent folder (name or ID)")
    .option("--clear-parent", "Move to the top level")
    .action(
      async (
        folder: string,
        options: {
          name?: string;
          status?: "active" | "dropped";
          parent?: string;
          clearParent?: true;
        },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const input: UpdateFolderInput = {
          name: options.name,
          status: options.status,
          parent: options.clearParent ? null : options.parent,
        };
        const bridge = new OmniFocusBridge();
        const script = buildUpdateFolderScript(folder, input);
        const updated = await bridge.executeAndParse<FolderSummary>(script);
        writeOutput(updated, globalOpts.format);
      },
    );

  return folders;
}
