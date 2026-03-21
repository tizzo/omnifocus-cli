# omnifocus-cli

A command-line interface for [OmniFocus](https://www.omnigroup.com/omnifocus/) on macOS. Manage tasks, projects, tags, and more from your terminal.

Designed for both human use and AI agent consumption — outputs structured JSON by default.

## Requirements

- macOS (uses `osascript` for OmniFocus communication)
- [OmniFocus Pro](https://www.omnigroup.com/omnifocus/) (scripting requires Pro)
- OmniFocus must be running
- Node.js >= 20
- You may need to grant Automation permission in **System Settings > Privacy & Security > Automation** for your terminal to control OmniFocus

## Install

```bash
npm install -g omnifocus-cli
```

Or run directly during development:

```bash
npx tsx src/index.ts <command>
```

## Usage

All commands output JSON by default. Use `--format pretty` for human-readable output.

### Tasks

```bash
# List tasks (with filters)
omnifocus tasks list
omnifocus tasks list --flagged --limit 10
omnifocus tasks list --project "Work" --status available
omnifocus tasks list --due-before 2024-12-31 --sort due
omnifocus tasks list --tag "urgent" --count

# Create a task
omnifocus tasks create "Buy groceries" --project "Home" --tag "errands" --due 2024-12-31

# View, update, complete, delete
omnifocus tasks view <id>
omnifocus tasks update <id> --name "New name" --flag --add-tag "important"
omnifocus tasks complete <id>
omnifocus tasks delete <id>

# Move a task to a different project
omnifocus tasks move <id> --project "Work"
```

### Projects

```bash
omnifocus projects list
omnifocus projects list --status onhold --folder "Work"
omnifocus projects tasks "My Project"
omnifocus projects create "New Project" --folder "Work" --sequential
omnifocus projects view "My Project"
omnifocus projects update "My Project" --status onhold
omnifocus projects complete "My Project"
omnifocus projects delete "My Project"
```

### Inbox

```bash
omnifocus inbox list
```

### Tags

```bash
omnifocus tags list
omnifocus tags list --flat
omnifocus tags create "New Tag"
omnifocus tags update "Old Name" --name "New Name" --status onhold
omnifocus tags delete "Unused Tag"
```

### Folders

```bash
omnifocus folders list
omnifocus folders view "Work"
```

### Search

```bash
omnifocus search "budget report"
omnifocus search "meeting" --project "Work" --limit 5
omnifocus search "old task" --include-completed
```

### Forecast

```bash
omnifocus forecast
```

Returns overdue tasks, tasks due today, tasks due soon (7 days), flagged tasks, and tasks deferred to today.

### Perspectives

```bash
omnifocus perspectives list
```

### Statistics

```bash
omnifocus stats
```

Returns counts for tasks (total, available, completed, remaining, overdue, flagged, inbox), projects (by status), tags, and folders.

### Help

```bash
# Show all commands and options in one shot (useful for AI agents)
omnifocus help-all

# Standard help
omnifocus --help
omnifocus tasks --help
omnifocus tasks list --help
```

## Output Format

JSON by default (for AI/programmatic consumption):

```bash
omnifocus tasks list --flagged --limit 2
```

```json
[
  {
    "id": "abc123",
    "name": "Review quarterly report",
    "flagged": true,
    "completed": false,
    "dueDate": "2024-12-31T00:00:00.000Z",
    "taskStatus": "Available",
    "project": { "id": "def456", "name": "Work" },
    "tags": [{ "id": "ghi789", "name": "urgent" }]
  }
]
```

Pretty-print for terminal use:

```bash
omnifocus tasks list --flagged --format pretty
```

Errors are structured JSON to stderr:

```json
{
  "error": true,
  "code": "TASK_NOT_FOUND",
  "message": "Task not found: invalid-id"
}
```

## How It Works

The CLI communicates with OmniFocus through macOS's built-in scripting infrastructure. No plugins or extensions are installed into OmniFocus.

1. The CLI builds an [Omni Automation](https://omni-automation.com/omnifocus/) JavaScript script
2. Wraps it in a JXA (JavaScript for Automation) call: `Application("OmniFocus").evaluateJavascript(script)`
3. Executes via `/usr/bin/osascript -l JavaScript`
4. Parses the JSON response

This uses only:
- `osascript` (built into macOS)
- JXA (built into macOS)
- `evaluateJavascript()` (built into OmniFocus Pro)

## Development

```bash
# Run during development (no build step)
npx tsx src/index.ts tasks list --flagged

# Type-check
npm run typecheck

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Build for distribution
npm run build
```

## License

MIT
