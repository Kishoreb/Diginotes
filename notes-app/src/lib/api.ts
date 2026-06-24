import { SearchResult, Task } from "../types";

const API_BASE = "http://localhost:3001/api";

async function request(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  getDataFolder: async (): Promise<string | null> => {
    const data = await request("/data-folder");
    return data.folder;
  },

  pickFolder: async (): Promise<string | null> => {
    const data = await request("/pick-folder", { method: "POST" });
    return data.path;
  },

  setDataFolder: async (path: string): Promise<string> => {
    const data = await request("/data-folder", {
      method: "POST",
      body: JSON.stringify({ path }),
    });
    return data.folder;
  },

  changeDataFolder: async (newPath: string, copyExisting: boolean): Promise<string> => {
    const data = await request("/change-data-folder", {
      method: "POST",
      body: JSON.stringify({ newPath, copyExisting }),
    });
    return data.folder;
  },

  getProjectTree: async () => {
    const data = await request("/project-tree");
    return data.tree;
  },

  createProject: async (name: string) => {
    const data = await request("/create-project", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return data.path;
  },

  createFolder: async (parentPath: string, name: string) => {
    const data = await request("/create-folder", {
      method: "POST",
      body: JSON.stringify({ parentPath, name }),
    });
    return data.path;
  },

  renameEntry: async (oldPath: string, newName: string) => {
    const data = await request("/rename-entry", {
      method: "POST",
      body: JSON.stringify({ oldPath, newName }),
    });
    return data.path;
  },

  moveEntry: async (sourcePath: string, destFolderPath: string) => {
    const data = await request("/move-entry", {
      method: "POST",
      body: JSON.stringify({ sourcePath, destFolderPath }),
    });
    return data.path;
  },

  deleteEntry: async (targetPath: string) => {
    await request("/delete-entry", {
      method: "POST",
      body: JSON.stringify({ targetPath }),
    });
  },

  createNote: async (parentPath: string, name: string) => {
    const data = await request("/create-note", {
      method: "POST",
      body: JSON.stringify({ parentPath, name }),
    });
    return data.path;
  },

  readNote: async (filePath: string): Promise<string> => {
    const data = await request(`/read-note?path=${encodeURIComponent(filePath)}`);
    return data.content;
  },

  saveNote: async (filePath: string, content: string) => {
    await request("/save-note", {
      method: "POST",
      body: JSON.stringify({ filePath, content }),
    });
  },

  uploadFile: async (parentPath: string, name: string, dataBase64: string) => {
    const data = await request("/upload-file", {
      method: "POST",
      body: JSON.stringify({ parentPath, name, dataBase64 }),
    });
    return data.path;
  },

  saveScreenshot: async (parentPath: string, dataBase64: string) => {
    const data = await request("/save-screenshot", {
      method: "POST",
      body: JSON.stringify({ parentPath, dataBase64 }),
    });
    return data;
  },

  openFile: async (filePath: string) => {
    await request("/open-file", {
      method: "POST",
      body: JSON.stringify({ filePath }),
    });
  },

  listFiles: async (dirPath: string) => {
    const data = await request(`/list-files?path=${encodeURIComponent(dirPath)}`);
    return data.files;
  },

  getTasks: async (projectPath: string): Promise<Task[]> => {
    const data = await request(`/tasks?projectPath=${encodeURIComponent(projectPath)}`);
    return data.tasks;
  },

  saveTasks: async (projectPath: string, tasks: Task[]) => {
    await request("/tasks", {
      method: "POST",
      body: JSON.stringify({ projectPath, tasks }),
    });
  },

  search: async (query: string): Promise<SearchResult[]> => {
    const data = await request(`/search?q=${encodeURIComponent(query)}`);
    return data.results;
  },
};
