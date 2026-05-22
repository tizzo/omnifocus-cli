// ---------------------------------------------------------------------------
// Reference types (lightweight, for nested references)
// ---------------------------------------------------------------------------

export type TaskRef = {
  readonly id: string;
  readonly name: string;
};

export type ProjectRef = {
  readonly id: string;
  readonly name: string;
};

export type TagRef = {
  readonly id: string;
  readonly name: string;
};

export type FolderRef = {
  readonly id: string;
  readonly name: string;
};

// ---------------------------------------------------------------------------
// Status unions
// ---------------------------------------------------------------------------

export type TaskStatus =
  | "Available"
  | "Blocked"
  | "Completed"
  | "Dropped"
  | "DueSoon"
  | "Next"
  | "Overdue";

export type ProjectStatus = "Active" | "Done" | "Dropped" | "OnHold";

export type TagStatus = "Active" | "Dropped" | "OnHold";

// ---------------------------------------------------------------------------
// Full entity types
// ---------------------------------------------------------------------------

export type TaskSummary = {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly flagged: boolean;
  readonly completed: boolean;
  readonly completionDate: string | null;
  readonly dueDate: string | null;
  readonly deferDate: string | null;
  readonly effectiveDueDate: string | null;
  readonly effectiveDeferDate: string | null;
  readonly taskStatus: TaskStatus;
  readonly project: ProjectRef | null;
  readonly tags: readonly TagRef[];
  readonly hasChildren: boolean;
  readonly estimatedMinutes: number | null;
  readonly inInbox: boolean;
};

export type ProjectSummary = {
  readonly id: string;
  readonly name: string;
  readonly status: ProjectStatus;
  readonly taskCount: number;
  readonly remainingTaskCount: number;
  readonly dueDate: string | null;
  readonly deferDate: string | null;
  readonly completed: boolean;
  readonly flagged: boolean;
  readonly sequential: boolean;
  readonly folder: FolderRef | null;
  readonly note: string;
};

export type TagSummary = {
  readonly id: string;
  readonly name: string;
  readonly status: TagStatus;
  readonly taskCount: number;
  readonly availableTaskCount: number;
  readonly children?: readonly TagSummary[] | undefined;
};

export type FolderSummary = {
  readonly id: string;
  readonly name: string;
  readonly status: "Active" | "Dropped";
  readonly projectCount: number;
  readonly folderCount: number;
  readonly parent: FolderRef | null;
};

export type PerspectiveSummary = {
  readonly id: string;
  readonly name: string;
  readonly isBuiltIn: boolean;
};

export type FolderDetail = FolderSummary & {
  readonly projects: readonly ProjectSummary[];
  readonly subfolders: readonly FolderSummary[];
};

export type DeleteResult = {
  readonly deleted: boolean;
  readonly id: string;
  readonly name: string;
};

export type ForecastResult = {
  readonly overdue: readonly TaskSummary[];
  readonly dueToday: readonly TaskSummary[];
  readonly dueSoon: readonly TaskSummary[];
  readonly flagged: readonly TaskSummary[];
  readonly deferredToToday: readonly TaskSummary[];
};

export type StatsResult = {
  readonly tasks: {
    readonly total: number;
    readonly available: number;
    readonly completed: number;
    readonly remaining: number;
    readonly overdue: number;
    readonly dueSoon: number;
    readonly flagged: number;
    readonly inbox: number;
  };
  readonly projects: {
    readonly total: number;
    readonly active: number;
    readonly onHold: number;
    readonly completed: number;
    readonly dropped: number;
  };
  readonly tags: {
    readonly total: number;
  };
  readonly folders: {
    readonly total: number;
  };
};

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type CreateTaskInput = {
  readonly name: string;
  readonly project?: string | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly dueDate?: string | undefined;
  readonly deferDate?: string | undefined;
  readonly note?: string | undefined;
  readonly flagged?: boolean | undefined;
};

export type UpdateTaskInput = {
  readonly name?: string | undefined;
  readonly note?: string | undefined;
  readonly dueDate?: string | null | undefined;
  readonly deferDate?: string | null | undefined;
  readonly flagged?: boolean | undefined;
  readonly project?: string | null | undefined;
  readonly addTags?: readonly string[] | undefined;
  readonly removeTags?: readonly string[] | undefined;
};

export type CreateProjectInput = {
  readonly name: string;
  readonly folder?: string | undefined;
  readonly note?: string | undefined;
  readonly dueDate?: string | undefined;
  readonly deferDate?: string | undefined;
  readonly sequential?: boolean | undefined;
  readonly status?: "active" | "onhold" | undefined;
};

export type UpdateProjectInput = {
  readonly name?: string | undefined;
  readonly note?: string | undefined;
  readonly dueDate?: string | null | undefined;
  readonly deferDate?: string | null | undefined;
  readonly status?: "active" | "onhold" | "done" | "dropped" | undefined;
};

export type UpdateTagInput = {
  readonly name?: string | undefined;
  readonly status?: "active" | "onhold" | "dropped" | undefined;
};

export type CreateFolderInput = {
  readonly name: string;
  readonly parent?: string | undefined;
};

export type UpdateFolderInput = {
  readonly name?: string | undefined;
  readonly status?: "active" | "dropped" | undefined;
  readonly parent?: string | null | undefined;
};

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export type TaskListFilters = {
  readonly flagged?: boolean | undefined;
  readonly project?: string | undefined;
  readonly tag?: string | undefined;
  readonly status?: "available" | "completed" | "blocked" | "dropped" | "remaining" | undefined;
  readonly dueBefore?: string | undefined;
  readonly dueAfter?: string | undefined;
  readonly sort?: "name" | "due" | "defer" | "flagged" | undefined;
  readonly limit?: number | undefined;
  readonly countOnly?: boolean | undefined;
};

export type ProjectFilters = {
  readonly status?: "active" | "onhold" | "all" | undefined;
  readonly folder?: string | undefined;
};

export type ProjectTaskOptions = {
  readonly completed?: boolean | undefined;
};

export type TagListOptions = {
  readonly flat?: boolean | undefined;
};

export type SearchOptions = {
  readonly includeCompleted?: boolean | undefined;
  readonly project?: string | undefined;
  readonly tag?: string | undefined;
  readonly limit?: number | undefined;
};
