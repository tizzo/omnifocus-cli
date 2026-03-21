import { Command } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import {
  buildListFoldersScript,
  buildViewFolderScript,
} from "../omnifocus/folder-scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type { FolderSummary } from "../types/omnifocus.js";

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
      const result = await bridge.executeAndParse<FolderSummary>(script);
      writeOutput(result, globalOpts.format);
    });

  return folders;
}
