# Notes Taking App - Specification Document

## 1. Overview

A Windows desktop application for personal note-taking, organized by projects. All user data is stored locally on the laptop as human-readable files. The app provides text notes, a canvas/whiteboard, file attachments, a simple task board, and full-text search across everything.

---

## 2. Platform & Environment

| Attribute | Detail |
|-----------|--------|
| OS | Windows 10/11 |
| Network | Corporate network (no internet dependency) |
| Users | Single user, no authentication |
| Storage | Fully local, on laptop filesystem |
| Deployment | Standalone desktop app (Tauri) |

---

## 3. Core Concepts

### 3.1 Project
- Top-level organizational unit
- A user can have multiple projects
- Each project maps to a folder on disk

### 3.2 Sub-folders / Categories
- Within a project, the user can create nested sub-folders to organize content
- Mirrors the actual folder structure on disk

### 3.3 Note
- A plain text file stored in the project/sub-folder
- User chooses file extension (`.txt`, `.md`, `.log`, etc.)
- Editable within the app via a simple text editor

### 3.4 Canvas (Whiteboard)
- A bounded (large but not infinite) drawing/whiteboard surface
- Supports: freehand drawing, shapes, sticky notes/boxes with text, tables, adding images/screenshots
- Each canvas is saved locally as a named file
- Uses **tldraw native format** if integration is straightforward; otherwise falls back to a custom JSON schema
- User can have multiple canvases per project/sub-folder

### 3.5 Task Board
- A simple kanban board per project
- Tasks are **separate** from notes (not extracted from note content)
- Fixed columns: **To Do → In Progress → Done**
- Tasks have: title, optional description, optional due date
- Tasks are draggable between columns

### 3.6 Files / Attachments
- User can add any file to a project/sub-folder
- Files are stored as-is on disk
- Opening a file launches the default Windows application
- (Nice-to-have) In-app preview for common types: images, PDFs

---

## 4. Storage & Data Model

### 4.1 Philosophy
- **User content = real files on disk** (readable/browsable in Windows Explorer)
- **App metadata = SQLite** (search index, task board state, canvas metadata, app settings)

### 4.2 Data Folder
- **User-configurable** location (set on first launch, changeable in settings)
- Default suggestion: `Documents\NotesApp\`
- The app remembers the configured path in a small config file in `%APPDATA%`

### 4.3 Folder Structure on Disk

```
<user-configured-data-folder>/
├── projects/
│   ├── ProjectA/
│   │   ├── notes/
│   │   │   ├── meeting-notes.txt
│   │   │   ├── ideas.md
│   │   │   └── debug-log.log
│   │   ├── canvases/
│   │   │   ├── architecture-diagram.tldr    (tldraw native)
│   │   │   └── brainstorm.tldr
│   │   ├── files/
│   │   │   ├── screenshot-2024-01-15.png
│   │   │   └── reference-doc.pdf
│   │   └── sub-folder-1/
│   │       ├── notes/
│   │       ├── canvases/
│   │       └── files/
│   └── ProjectB/
│       └── ...
├── app.db              (SQLite - search index, tasks, settings)
└── config.json         (app preferences, hotkey config, theme)
```

### 4.4 SQLite Database Contents
- Full-text search index (mirrors note content for fast search)
- Task board data (tasks, columns, positions per project)
- Canvas metadata (name, project, last modified)
- App state (window position, last opened project, sidebar state)

### 4.5 App Config Location
- `%APPDATA%\NotesApp\launcher.json` — stores only the path to the user-configured data folder
- Everything else lives inside the data folder itself

---

## 5. Features

### 5.1 Project Management
- Create / rename / delete projects
- Browse project tree in a sidebar (Explorer-style)
- Create sub-folders within projects (unlimited nesting)

### 5.2 Note Editor
- Plain text editor with basic features:
  - Create, edit, save, delete notes
  - User chooses file name and extension on creation
  - Auto-save on change (debounced)
  - Word wrap toggle
  - Basic find & replace within a note
  - Line numbers (optional)
- No rich text rendering — plain text only

### 5.3 Canvas / Whiteboard
- Bounded large canvas (not infinite scroll)
- Tools:
  - Freehand pen/draw
  - Rectangle / Ellipse shapes
  - Sticky note / text box (with editable text inside)
  - Table (simple grid with editable cells)
  - Image insert (paste from clipboard or pick file)
  - Arrow / line connector
  - Select / move / resize / delete elements
- Pan & zoom within the bounded area
- Each canvas saved as a `.tldr` file (tldraw native format preferred)
- If tldraw integration proves too complex, use custom `.canvas.json` format
- Export canvas as PNG (nice-to-have)

### 5.4 Screenshots & Images
- Paste screenshot from clipboard directly into:
  - A canvas (placed as image element)
  - A project folder (saved as `.png` file with auto-generated timestamp name)
- Drag & drop image files into the app
- Global hotkey to capture and save screenshot to current project

### 5.5 Task Board
- Simple kanban per project
- Fixed columns: To Do, In Progress, Done
- Task properties:
  - Title (required)
  - Description (optional, plain text)
  - Due date (optional)
  - Created date (auto)
- Drag & drop between columns
- Reorder within columns
- Create / edit / delete tasks
- Stored in SQLite (not as files — app-managed structured data)

### 5.6 Search
- Global full-text search across all projects and notes
- Search results show: file name, project, sub-folder, matching snippet with highlight
- Clicking a result opens the note/canvas/file
- Search index kept in sync when notes are created, edited, or deleted
- Powered by SQLite FTS5

### 5.7 System Tray & Global Hotkey
- App minimizes to system tray (close button minimizes, not exits)
- Global hotkey (configurable, default: `Ctrl+Shift+N`) actions:
  - Quick-create a note (small popup to jot text, saved to current/default project)
  - Paste screenshot from clipboard to current project
- Tray icon right-click menu: Open app, Quick note, Quick screenshot, Quit
- Hotkey works even when app is minimized/in tray

### 5.8 File Management
- Add files to any project/sub-folder (copy into project folder)
- Double-click to open with default Windows app
- Delete / rename files from within the app
- Drag & drop files into the app to import
- (Nice-to-have) Thumbnail preview for images in file list

### 5.9 Settings
- Configure data folder location (with migration option if changed)
- Configure global hotkey key combination
- Default project for quick notes
- Theme (light/dark — nice-to-have)

---

## 6. User Interface

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Menu Bar / Toolbar                              [Search 🔍] │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  Main Content Area                          │
│              │                                              │
│  - Projects  │  (Note Editor / Canvas / Task Board /       │
│    - Folders │   File Browser - depending on selection)    │
│    - Notes   │                                              │
│    - Canvas  │                                              │
│    - Files   │                                              │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  Status Bar (current project, file path, word count)        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Navigation
- Sidebar shows project tree (collapsible folders)
- Tabs or breadcrumb for switching between Note/Canvas/Tasks/Files within a project
- Double-click to open items, right-click for context menu (rename, delete, move)
- Keyboard shortcuts for common actions

---

## 7. Technical Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | **Tauri v2** | Lightweight, Rust backend, small bundle (~10MB vs Electron's ~100MB+) |
| Frontend | **React 18** + **TypeScript** | Component-based UI, rich ecosystem |
| Canvas | **tldraw** library | Proven whiteboard, native JSON format, React-compatible |
| Text Editor | **CodeMirror 6** | Lightweight, extensible, supports plain text well |
| Database | **SQLite** (via `tauri-plugin-sql`) | Local search index & task storage |
| Search | **SQLite FTS5** | Full-text search, fast, no extra dependencies |
| Task Board | **dnd-kit** or **react-beautiful-dnd** | Drag & drop for kanban |
| Styling | **Tailwind CSS** | Utility-first, fast to build UI |
| Build | **Vite** | Fast HMR and bundling |
| File Ops | **Tauri fs API** + Rust commands | Native filesystem access |
| System Tray | **Tauri system tray API** | Native tray icon and menu |
| Global Hotkey | **tauri-plugin-global-shortcut** | Register system-wide hotkeys |

---

## 8. Non-Functional Requirements

- **Performance**: Startup < 2 seconds. Responsive UI for typical usage (dozens of projects, hundreds of notes).
- **Data safety**: Auto-save with debounce. No data loss on crash. Files always on disk.
- **Portability**: Data folder is self-contained — can be copied, backed up, or moved to another machine.
- **Low footprint**: < 50MB RAM when idle in tray. Minimal CPU usage.
- **No network**: Zero internet calls. Fully functional air-gapped.
- **Bundle size**: < 20MB installer (Tauri advantage).

---

## 9. Future / Deferred (Phase 2+)

- **AI Integration**: Summarize tasks, auto-categorize notes, generate action items (local LLM or API)
- **In-app file preview**: PDF viewer, image viewer with zoom
- **Custom task board columns**: User-defined workflow stages
- **Note templates**: Pre-filled note structures
- **Export project** as ZIP
- **Markdown rendering**: Toggle preview for `.md` files
- **Tags**: Cross-project tagging and filtering
- **Version history**: Simple backup snapshots of notes
- **Multiple windows**: Detach canvas/note into separate window
- **Import**: Bulk import from other note apps

---

## 10. MVP Scope (Phase 1)

The minimum viable product includes:

1. ✅ Project creation and folder structure
2. ✅ Sub-folders within projects (unlimited nesting)
3. ✅ Plain text note editor with auto-save (user-chosen file extension)
4. ✅ Canvas/whiteboard with tldraw (shapes, sticky notes, tables, images, freehand)
5. ✅ Paste/upload screenshots
6. ✅ File attachments (stored on disk, open with OS default app)
7. ✅ Task board (To Do / In Progress / Done)
8. ✅ Full-text search across all projects and notes
9. ✅ System tray with global hotkey (quick note + screenshot)
10. ✅ User-configurable data folder location
11. ✅ All user files stored as readable files on disk

---

## 11. Resolved Decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1 | App framework | **Tauri v2** |
| 2 | Data folder location | **User-configurable** (set on first launch, changeable in settings) |
| 3 | Canvas file format | **tldraw native format** preferred; custom JSON as fallback if integration is too complex |
| 4 | Note file extension | **User's choice** — can use `.txt`, `.md`, `.log`, or any extension |

---

*Document Version: 2.0*
*Status: FINAL — Ready for development*
