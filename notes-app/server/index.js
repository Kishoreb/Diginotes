import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// --- Config ---
const APP_CONFIG_DIR = path.join(process.env.APPDATA || path.join(process.env.HOME, ".config"), "NotesApp");
const LAUNCHER_CONFIG_PATH = path.join(APP_CONFIG_DIR, "launcher.json");

function getDataFolder() {
  if (fs.existsSync(LAUNCHER_CONFIG_PATH)) {
    try {
      const content = fs.readFileSync(LAUNCHER_CONFIG_PATH, "utf-8");
      const config = JSON.parse(content);
      if (config.data_folder && fs.existsSync(config.data_folder)) {
        initializeDataFolder(config.data_folder);
        return config.data_folder;
      }
    } catch (e) { /* ignore */ }
  }
  return null;
}

function setDataFolder(folderPath) {
  fs.mkdirSync(folderPath, { recursive: true });
  initializeDataFolder(folderPath);
  fs.mkdirSync(APP_CONFIG_DIR, { recursive: true });
  fs.writeFileSync(LAUNCHER_CONFIG_PATH, JSON.stringify({ data_folder: folderPath }, null, 2));
  return folderPath;
}

function initializeDataFolder(folderPath) {
  fs.mkdirSync(path.join(folderPath, "projects"), { recursive: true });
  const configPath = path.join(folderPath, "config.json");
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ globalHotkey: "Ctrl+Shift+N", defaultProject: null }, null, 2));
  }
}

// --- Tree ---
function readDirRecursive(dirPath) {
  const entries = [];
  if (!fs.existsSync(dirPath)) return entries;

  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  items.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const item of items) {
    const itemPath = path.join(dirPath, item.name);
    const isDir = item.isDirectory();
    entries.push({
      name: item.name,
      path: itemPath,
      isDir,
      children: isDir ? readDirRecursive(itemPath) : [],
    });
  }
  return entries;
}

// --- Routes ---

// Browsers can't expose an absolute OS path for a folder picked via <input>,
// so we ask the server (which has real filesystem access) to pop up the
// native Windows folder browser and hand back the chosen path.
app.post("/api/pick-folder", (req, res) => {
  // A FolderBrowserDialog launched from a background process has no parent
  // window, so Windows often opens it BEHIND the browser instead of in
  // front — looks like "nothing happened". An invisible, topmost owner
  // window forces it to the foreground.
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "$owner = New-Object System.Windows.Forms.Form",
    "$owner.TopMost = $true",
    "$owner.StartPosition = 'Manual'",
    "$owner.Location = New-Object System.Drawing.Point(-2000,-2000)",
    "$owner.ShowInTaskbar = $false",
    "$owner.Size = New-Object System.Drawing.Size(1,1)",
    "$owner.Show()",
    "$owner.Activate()",
    "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog",
    "$dialog.Description = 'Choose a folder for your Notes App data'",
    "$result = $dialog.ShowDialog($owner)",
    "$owner.Close()",
    "if ($result -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.SelectedPath }",
  ].join("; ");

  execFile(
    "powershell.exe",
    ["-NoProfile", "-Command", script],
    { timeout: 120000 },
    (err, stdout, stderr) => {
      if (err) {
        console.error("pick-folder failed:", stderr || err.message);
        return res.status(500).json({ error: "Failed to open folder picker" });
      }
      const selected = stdout.trim();
      res.json({ path: selected || null });
    }
  );
});

app.get("/api/data-folder", (req, res) => {
  res.json({ folder: getDataFolder() });
});

app.post("/api/data-folder", (req, res) => {
  try {
    const folder = setDataFolder(req.body.path);
    res.json({ folder });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/change-data-folder", (req, res) => {
  const { newPath, copyExisting } = req.body;
  if (!newPath) return res.status(400).json({ error: "newPath is required" });

  const currentFolder = getDataFolder();
  try {
    if (copyExisting && currentFolder && path.resolve(currentFolder) !== path.resolve(newPath)) {
      fs.mkdirSync(newPath, { recursive: true });
      fs.cpSync(currentFolder, newPath, { recursive: true });
    }
    const folder = setDataFolder(newPath);
    res.json({ folder });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/project-tree", (req, res) => {
  const dataFolder = getDataFolder();
  if (!dataFolder) return res.status(400).json({ error: "No data folder configured" });
  const tree = readDirRecursive(path.join(dataFolder, "projects"));
  res.json({ tree });
});

app.post("/api/create-project", (req, res) => {
  const dataFolder = getDataFolder();
  if (!dataFolder) return res.status(400).json({ error: "No data folder configured" });
  const { name } = req.body;
  const projectPath = path.join(dataFolder, "projects", name);
  if (fs.existsSync(projectPath)) {
    return res.status(400).json({ error: `Project '${name}' already exists` });
  }
  fs.mkdirSync(path.join(projectPath, "notes"), { recursive: true });
  fs.mkdirSync(path.join(projectPath, "canvases"), { recursive: true });
  fs.mkdirSync(path.join(projectPath, "files"), { recursive: true });
  res.json({ path: projectPath });
});

app.post("/api/create-folder", (req, res) => {
  const { parentPath, name } = req.body;
  if (!parentPath || !name) {
    return res.status(400).json({ error: "parentPath and name are required" });
  }
  const newPath = path.join(parentPath, name);
  if (fs.existsSync(newPath)) {
    return res.status(400).json({ error: `'${name}' already exists` });
  }
  fs.mkdirSync(newPath, { recursive: true });
  res.json({ path: newPath });
});

app.post("/api/rename-entry", (req, res) => {
  const { oldPath, newName } = req.body;
  if (!fs.existsSync(oldPath)) return res.status(400).json({ error: "Path does not exist" });
  const parent = path.dirname(oldPath);
  const newPath = path.join(parent, newName);
  if (fs.existsSync(newPath)) return res.status(400).json({ error: `'${newName}' already exists` });
  fs.renameSync(oldPath, newPath);
  res.json({ path: newPath });
});

app.post("/api/move-entry", (req, res) => {
  const { sourcePath, destFolderPath } = req.body;
  if (!sourcePath || !destFolderPath) {
    return res.status(400).json({ error: "sourcePath and destFolderPath are required" });
  }
  if (!fs.existsSync(sourcePath)) return res.status(400).json({ error: "Source does not exist" });
  if (!fs.existsSync(destFolderPath) || !fs.statSync(destFolderPath).isDirectory()) {
    return res.status(400).json({ error: "Destination folder does not exist" });
  }

  const resolvedSource = path.resolve(sourcePath);
  const resolvedDest = path.resolve(destFolderPath);

  if (resolvedDest === path.dirname(resolvedSource)) {
    return res.json({ path: sourcePath }); // already there
  }
  if (resolvedDest === resolvedSource || resolvedDest.startsWith(resolvedSource + path.sep)) {
    return res.status(400).json({ error: "Can't move a folder into itself" });
  }

  const name = path.basename(sourcePath);
  const newPath = path.join(destFolderPath, name);
  if (fs.existsSync(newPath)) {
    return res.status(400).json({ error: `'${name}' already exists in the destination folder` });
  }
  try {
    fs.renameSync(sourcePath, newPath);
    res.json({ path: newPath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/delete-entry", (req, res) => {
  const { targetPath } = req.body;
  if (!fs.existsSync(targetPath)) return res.status(400).json({ error: "Path does not exist" });
  fs.rmSync(targetPath, { recursive: true, force: true });
  res.json({ success: true });
});

// --- Note Routes ---

app.post("/api/create-note", (req, res) => {
  const { parentPath, name } = req.body;
  if (!parentPath || !name) {
    return res.status(400).json({ error: "parentPath and name are required" });
  }
  const notePath = path.join(parentPath, name);
  if (fs.existsSync(notePath)) {
    return res.status(400).json({ error: `'${name}' already exists` });
  }
  fs.writeFileSync(notePath, "", "utf-8");
  res.json({ path: notePath });
});

app.get("/api/read-note", (req, res) => {
  const filePath = req.query.path;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: "File not found" });
  }
  const content = fs.readFileSync(filePath, "utf-8");
  res.json({ content });
});

app.post("/api/save-note", (req, res) => {
  const { filePath, content } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: "filePath is required" });
  }
  fs.writeFileSync(filePath, content, "utf-8");
  res.json({ success: true });
});

// --- File Routes ---

app.post("/api/upload-file", (req, res) => {
  const { parentPath, name, dataBase64 } = req.body;
  if (!parentPath || !name || !dataBase64) {
    return res.status(400).json({ error: "parentPath, name, and dataBase64 are required" });
  }
  const filePath = path.join(parentPath, name);
  if (fs.existsSync(filePath)) {
    return res.status(400).json({ error: `'${name}' already exists` });
  }
  const buffer = Buffer.from(dataBase64, "base64");
  fs.writeFileSync(filePath, buffer);
  res.json({ path: filePath });
});

app.post("/api/save-screenshot", (req, res) => {
  const { parentPath, dataBase64 } = req.body;
  if (!parentPath || !dataBase64) {
    return res.status(400).json({ error: "parentPath and dataBase64 are required" });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const name = `screenshot-${timestamp}.png`;
  const filePath = path.join(parentPath, name);
  const buffer = Buffer.from(dataBase64, "base64");
  fs.writeFileSync(filePath, buffer);
  res.json({ path: filePath, name });
});

app.post("/api/open-file", (req, res) => {
  const { filePath } = req.body;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: "File not found" });
  }
  import("child_process").then(({ exec }) => {
    exec(`start "" "${filePath}"`);
    res.json({ success: true });
  });
});

app.get("/api/list-files", (req, res) => {
  const dirPath = req.query.path;
  if (!dirPath || !fs.existsSync(dirPath)) {
    return res.status(400).json({ error: "Directory not found" });
  }
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = items
    .filter((item) => !item.isDirectory())
    .map((item) => {
      const filePath = path.join(dirPath, item.name);
      const stats = fs.statSync(filePath);
      return {
        name: item.name,
        path: filePath,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        extension: path.extname(item.name).toLowerCase(),
      };
    });
  res.json({ files });
});

// --- Task Board Routes ---
// Tasks for a project are stored in a sibling `tasks.json` at the project root
// (next to notes/, canvases/, files/) rather than SQLite, to avoid native
// module builds on a locked-down corporate laptop.

function tasksFilePath(projectPath) {
  return path.join(projectPath, "tasks.json");
}

app.get("/api/tasks", (req, res) => {
  const projectPath = req.query.projectPath;
  if (!projectPath) return res.status(400).json({ error: "projectPath is required" });
  const filePath = tasksFilePath(projectPath);
  if (!fs.existsSync(filePath)) return res.json({ tasks: [] });
  try {
    const tasks = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    res.json({ tasks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tasks", (req, res) => {
  const { projectPath, tasks } = req.body;
  if (!projectPath || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "projectPath and tasks array are required" });
  }
  fs.writeFileSync(tasksFilePath(projectPath), JSON.stringify(tasks, null, 2), "utf-8");
  res.json({ success: true });
});

// --- Search ---
// No SQLite in this build, so search reads note files on demand instead of
// maintaining an index. Fine at the target scale (dozens of projects,
// hundreds of notes) and avoids keeping an index in sync with the filesystem.

const BINARY_EXTENSIONS = new Set([".tldr", ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".pdf", ".zip"]);
const MAX_SEARCH_FILE_SIZE = 5 * 1024 * 1024; // skip oversized files so one huge note can't block the server

function findNoteFiles(dirPath, projectName, results) {
  if (!fs.existsSync(dirPath)) return;
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      if (item.name === "canvases" || item.name === "files") continue;
      findNoteFiles(itemPath, projectName, results);
    } else if (!BINARY_EXTENSIONS.has(path.extname(item.name).toLowerCase())) {
      results.push({ path: itemPath, name: item.name, projectName });
    }
  }
}

function buildSnippet(content, matchIndex, queryLen) {
  const start = Math.max(0, matchIndex - 40);
  const end = Math.min(content.length, matchIndex + queryLen + 40);
  let snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snippet = "…" + snippet;
  if (end < content.length) snippet = snippet + "…";
  return snippet;
}

app.get("/api/search", (req, res) => {
  const dataFolder = getDataFolder();
  if (!dataFolder) return res.status(400).json({ error: "No data folder configured" });
  const query = (req.query.q || "").trim();
  if (!query) return res.json({ results: [] });

  const projectsDir = path.join(dataFolder, "projects");
  const projects = fs.existsSync(projectsDir)
    ? fs.readdirSync(projectsDir, { withFileTypes: true }).filter((e) => e.isDirectory())
    : [];

  const noteFiles = [];
  for (const project of projects) {
    findNoteFiles(path.join(projectsDir, project.name), project.name, noteFiles);
  }

  const lowerQuery = query.toLowerCase();
  const results = [];
  for (const file of noteFiles) {
    let content;
    try {
      const stats = fs.statSync(file.path);
      if (stats.size > MAX_SEARCH_FILE_SIZE) continue;
      content = fs.readFileSync(file.path, "utf-8");
    } catch (e) {
      continue; // skip unreadable/non-text files
    }
    const matchIndex = content.toLowerCase().indexOf(lowerQuery);
    if (matchIndex !== -1) {
      results.push({
        path: file.path,
        name: file.name,
        projectName: file.projectName,
        snippet: buildSnippet(content, matchIndex, query.length),
      });
    }
    if (results.length >= 50) break;
  }

  res.json({ results });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`Notes App server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:1420 in your browser`);
});
