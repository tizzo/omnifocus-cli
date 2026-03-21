# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A strictly-typed TypeScript CLI for managing OmniFocus tasks from the terminal. Designed for AI agent consumption (JSON output by default). Communicates with OmniFocus through macOS's built-in scripting: `osascript -l JavaScript` calls `evaluateJavascript()` inside OmniFocus. No third-party OmniFocus plugins — only macOS osascript + OmniFocus Pro's native Omni Automation API.

## Commands

```bash
# Development (no build step needed)
npx tsx src/index.ts inbox list
npx tsx src/index.ts tasks list --flagged --limit 5
npx tsx src/index.ts tasks create "Buy milk" -p "Home" -t "errands"
npx tsx src/index.ts forecast
npx tsx src/index.ts search "budget" --limit 10

# Build, test, lint
npm run build                 # tsup → dist/index.js
npm test                      # vitest run (256 tests)
npm run test:coverage         # vitest with v8 coverage (80% thresholds)
npm run test:watch            # vitest in watch mode
npm run typecheck             # tsc --noEmit
npm run lint                  # biome check src/
npm run lint:fix              # biome check --write src/
```

## Architecture

```
Commands (commander)  →  Scripts (OmniJS builders)  →  Bridge (osascript)  →  OmniFocus
```

Three layers with strict separation:

- **Commands** (`src/commands/`) — Thin CLI handlers. Parse args, call scripts to build OmniJS code, pass to bridge, format output. Each exports a `create*Command()` function. 9 command files: inbox, tasks, projects, tags, folders, search, forecast, perspectives, stats.
- **Scripts** (`src/omnifocus/*.ts`) — Pure functions that generate OmniJS JavaScript strings. Domain-specific files: `scripts.ts` (original inbox/project/tag scripts + `escapeOmniString`), `task-scripts.ts`, `project-scripts.ts`, `folder-scripts.ts`, `tag-scripts.ts`, `forecast-scripts.ts`, `perspective-scripts.ts`, `stats-scripts.ts`.
- **Bridge** (`src/omnifocus/bridge.ts`) — `OmniFocusBridge` class. Two public methods: `executeOmniJS(code)` returns raw string, `executeAndParse<T>(code)` returns typed JSON. Uses `execFile` (not `exec`) to prevent shell injection.

Supporting modules:
- **Serializers** (`src/omnifocus/serializers.ts`) — String constants of JavaScript that run INSIDE OmniFocus (not Node). `TASK_SERIALIZER`, `PROJECT_SERIALIZER`, `TAG_SERIALIZER`, `FOLDER_SERIALIZER`, `PERSPECTIVE_SERIALIZER`. Use `function(){}` syntax for OmniFocus compatibility.
- **Types** (`src/types/omnifocus.ts`) — All entity types (`TaskSummary`, `ProjectSummary`, `TagSummary`, `FolderSummary`, `FolderDetail`, `ForecastResult`, `StatsResult`, etc.). All `readonly`. Dates as `string | null` (ISO 8601).
- **Formatter** (`src/output/formatter.ts`) — JSON (default) and pretty-print output.
- **Errors** (`src/errors.ts`) — `OmniFocusCliError` with typed error codes. Structured JSON to stderr.

## Key Conventions

- **No `any` types.** Strictest tsconfig: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
- **ESM only.** `"type": "module"` with `.js` extensions in all imports.
- **`import type`** for type-only imports (enforced by `verbatimModuleSyntax`).
- **OmniJS code is JavaScript in string literals.** It runs inside OmniFocus, not Node. The serializers and script builders produce these strings. When modifying, keep the serializer output shape in sync with the TypeScript types in `src/types/omnifocus.ts`.
- **`execFile` with args array**, never string interpolation into shell commands.
- **Errors to stderr** as JSON `{ error: true, code: string, message: string }`. Only `src/index.ts` calls `process.exit`.
- **Tag/project references throw on not found.** Never silently skip — always error when a `--tag` or `--project` value doesn't match.

## Testing

Tests use vitest with mocked `child_process` (bridge tests) and mocked bridge/formatter (command tests). Script tests are pure (no mocking). Coverage thresholds: 80% lines/branches/functions/statements. Run a single test file with `npx vitest run tests/scripts.test.ts`.

## OmniFocus Automation Notes

- Requires **OmniFocus Pro** (evaluateJavascript is Pro-only)
- OmniFocus must be running when CLI is invoked
- The bridge wraps OmniJS in JXA: `Application("OmniFocus").evaluateJavascript(code)` (on the app, not the document)
- OmniJS runs in OmniFocus's JavaScriptCore context — different from Node.js. No `require`, no `import`, no Node APIs.
- Project/tag/folder lookup uses dual strategy: `Entity.byIdentifier(id)` then `flattenedEntities.byName(name)`
- `projects` and `tags` are reserved globals in OmniJS — use different variable names (e.g., `resultProjects`)
