export interface Project {
  name: string;
  path: string;
}

export interface NoteFile {
  name: string;
  path: string;
  extension: string;
}

export interface FolderEntry {
  name: string;
  path: string;
  isDir: boolean;
  children?: FolderEntry[];
  isTaskBoard?: boolean;
}

export type TaskColumn = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  column: TaskColumn;
  position: number;
  createdAt: string;
}

export interface SearchResult {
  path: string;
  name: string;
  projectName: string;
  snippet: string;
}

export interface AppConfig {
  dataFolder: string;
  globalHotkey: string;
  defaultProject?: string;
}
