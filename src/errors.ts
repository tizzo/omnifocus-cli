export type ErrorCode =
  | "OMNIFOCUS_NOT_RUNNING"
  | "OMNIFOCUS_NOT_PRO"
  | "TASK_NOT_FOUND"
  | "PROJECT_NOT_FOUND"
  | "TAG_NOT_FOUND"
  | "SCRIPT_EXECUTION_FAILED"
  | "PARSE_FAILED"
  | "INVALID_INPUT";

export class OmniFocusCliError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "OmniFocusCliError";
  }
}

export function formatErrorOutput(error: unknown): string {
  if (error instanceof OmniFocusCliError) {
    return JSON.stringify(
      { error: true, code: error.code, message: error.message },
      null,
      2,
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  return JSON.stringify({ error: true, code: "UNKNOWN", message }, null, 2);
}
