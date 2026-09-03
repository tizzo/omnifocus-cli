import { Command, Option } from "commander";
import { OmniFocusBridge } from "../omnifocus/bridge.js";
import { buildListTagsScript } from "../omnifocus/scripts.js";
import {
  buildCreateTagScript,
  buildDeleteTagScript,
  buildUpdateTagScript,
} from "../omnifocus/tag-scripts.js";
import { writeOutput } from "../output/formatter.js";
import type { OutputFormat } from "../types/cli.js";
import type {
  DeleteResult,
  TagListOptions,
  TagSummary,
  UpdateTagInput,
} from "../types/omnifocus.js";

export function createTagsCommand(): Command {
  const tags = new Command("tags").description("Manage OmniFocus tags");

  tags
    .command("list")
    .description("List all tags")
    .option("--flat", "Flatten tag hierarchy", false)
    .action(async (options: { flat: boolean }, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const tagOptions: TagListOptions = {
        flat: options.flat,
      };
      const bridge = new OmniFocusBridge();
      const script = buildListTagsScript(tagOptions);
      const result = await bridge.executeAndParse<TagSummary[]>(script);
      writeOutput(result, globalOpts.format);
    });

  tags
    .command("create <name>")
    .description("Create a new tag")
    .action(async (name: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildCreateTagScript(name);
      const result = await bridge.executeAndParse<TagSummary>(script);
      writeOutput(result, globalOpts.format);
    });

  tags
    .command("delete <tag>")
    .description("Delete a tag")
    .action(async (tag: string, _options: unknown, command: Command) => {
      const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
      const bridge = new OmniFocusBridge();
      const script = buildDeleteTagScript(tag);
      const result = await bridge.executeAndParse<DeleteResult>(script);
      writeOutput(result, globalOpts.format);
    });

  tags
    .command("update <tag>")
    .description("Update a tag")
    .option("--name <name>", "Rename the tag")
    .addOption(
      new Option("--status <status>", "Set tag status").choices([
        "active",
        "onhold",
        "dropped",
      ]),
    )
    .action(
      async (
        tag: string,
        options: {
          name?: string;
          status?: "active" | "onhold" | "dropped";
        },
        command: Command,
      ) => {
        const globalOpts = command.optsWithGlobals<{ format: OutputFormat }>();
        const input: UpdateTagInput = {
          name: options.name,
          status: options.status,
        };
        const bridge = new OmniFocusBridge();
        const script = buildUpdateTagScript(tag, input);
        const result = await bridge.executeAndParse<TagSummary>(script);
        writeOutput(result, globalOpts.format);
      },
    );

  return tags;
}
