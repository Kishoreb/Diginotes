import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
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

// --- Start ---
app.listen(PORT, () => {
  console.log(`Notes App server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:1420 in your browser`);
});
