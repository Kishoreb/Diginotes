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
}

export interface Task {
  id: string;
  projectName: string;
  title: string;
  description?: string;
  dueDate?: string;
  column: "todo" | "in-progress" | "done";
  position: number;
  createdAt: string;
}

export interface AppConfig {
  dataFolder: string;
  globalHotkey: string;
  defaultProject?: string;
}
