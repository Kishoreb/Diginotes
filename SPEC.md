# Notes Taking App - Specification Document

> **Implementation status (2026-06-24):** Most of this spec is built and working — see [TASKS.md](TASKS.md) for the full task-by-task status. Two deliberate deviations from this document, made because the original target laptop is on a locked-down corporate network that can't install Tauri/Electron build tooling:
> - **Tech stack**: built as a local web app (Express server + React/Vite, opened in a browser tab) instead of Tauri. See Section 7.
> - **No SQLite**: app-managed data (currently just the task board) is stored as plain JSON files next to notes/canvases/files, instead of SQLite. See Section 4.
>
> One consequence: **system tray and global hotkey (Section 5.7) are not possible** in a plain browser tab and remain unbuilt unless this constraint changes.

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
| Deployment | ~~Standalone desktop app (Tauri)~~ → **Local web app**: `npm run dev` starts an Express API server + Vite dev server, opened in a regular browser tab |

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
- **App metadata = ~~SQLite~~ → plain JSON files** (no native module builds required — see implementation note at top of doc). Currently only the task board needs this; search has no index at all (see 5.6).

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
│   │   ├── tasks.json   (task board data for this project — see 4.4)
│   │   └── sub-folder-1/
│   │       ├── notes/
│   │       ├── canvases/
│   │       └── files/
│   └── ProjectB/
│       └── ...
└── config.json         (app preferences — currently just defaultProject/globalHotkey placeholders, unused)
```

### 4.4 App-Managed Data (was: "SQLite Database Contents")
- ~~Full-text search index~~ → no index; the server scans note files on demand at search time (capped at 5MB/file). Simpler than keeping an index in sync, fine at this app's scale (dozens of projects, hundreds of notes).
- Task board data (tasks, columns, positions) — one `tasks.json` file per project, sitting next to that project's `notes/`/`canvases/`/`files/` folders
- ~~Canvas metadata~~ → not tracked separately; canvases are just `.tldr` files, same as notes
- ~~App state (window position, etc.)~~ → not applicable to a browser tab

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
- CodeMirror 6 editor (via `@uiw/react-codemirror`) with:
  - Create, edit, save, delete, rename notes
  - User chooses file name and extension on creation
  - Auto-save on change (debounced 800ms); Ctrl+S forces an immediate save
  - Line numbers, word wrap
  - Find & replace within a note (Ctrl+F — built into CodeMirror's basicSetup)
  - Simple formatting toolbar for `.md`/`.txt` files: Bold/Italic/Heading/Bullet list/Inline code buttons insert markdown syntax at the cursor
- No rich text rendering — plain text only (the formatting toolbar inserts plain markdown syntax characters; it doesn't render styled text)

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
- ~~Stored in SQLite~~ → stored in a `tasks.json` file per project (see 4.4) — still app-managed structured data, just not user-facing files the way notes/canvases are

### 5.6 Search
- Global full-text search across all projects and notes (Ctrl+K to focus the search bar)
- Search results show: file name, project, matching snippet
- Clicking a result opens the note
- ~~Search index kept in sync~~ → no index; server scans files live on every search (see 4.4)
- ~~Powered by SQLite FTS5~~ → plain substring search over file contents read on demand

### 5.7 System Tray & Global Hotkey — **NOT IMPLEMENTED, architecturally blocked**
- A plain browser tab cannot register an OS-level system tray icon or a global hotkey that works while the app isn't focused. This entire section requires Tauri or Electron, which the corporate-laptop constraint rules out (see implementation note at top of doc). Revisit if that constraint changes.

### 5.8 File Management
- Add files to any project/sub-folder (copy into project folder, drag & drop, or paste a screenshot from clipboard)
- Double-click to open with default Windows app
- Delete / rename files from within the app (hover a file for the ✏️/🗑️ buttons)
- **Drag-and-drop to move** notes/canvases/files/folders between project folders in the sidebar tree
- (Nice-to-have, not built) Thumbnail preview for images in file list

### 5.9 Settings
- Configure data folder location, via a native Windows folder-browser dialog ("Browse..." button) or by typing a path
- Optional migration: copy existing projects/notes to the new location, or just point at a fresh empty folder
- ~~Configure global hotkey~~ / ~~Default project for quick notes~~ → not applicable, no tray/hotkey feature exists to configure (see 5.7)
- Theme (light/dark) — not built

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
| Framework | ~~Tauri v2~~ → **Express + Vite local web app** | Corporate laptop can't install Tauri/Electron build tooling; a local Node server + browser tab needs nothing but `npm install` |
| Frontend | **React 18** + **TypeScript** | Component-based UI, rich ecosystem |
| Canvas | **tldraw** (v5.1.1) | Proven whiteboard, native JSON format, React-compatible. Free-tier SDK shows a small "Made with tldraw" watermark — acceptable for an internal tool |
| Text Editor | **CodeMirror 6** (via `@uiw/react-codemirror`) | Lightweight, extensible, supports plain text well; gets find/replace and a markdown toolbar "for free" |
| Database | ~~SQLite~~ → **plain JSON files** | Avoids native module compilation, which is unreliable on a locked-down corporate laptop; fits the "everything is a readable file" philosophy |
| Search | ~~SQLite FTS5~~ → **on-demand file scan** | No index to keep in sync; reads note files live each search, capped at 5MB/file so one huge note can't block the server |
| Task Board | **dnd-kit** | Drag & drop for kanban |
| Styling | **Tailwind CSS** | Utility-first, fast to build UI |
| Icons | **lucide-react** | Consistent vector icons matched per file type, instead of emoji |
| Build | **Vite** | Fast HMR and bundling |
| File Ops | **Node `fs` module**, called from Express routes | Server has full filesystem access; no native bindings needed |
| Folder picker | **PowerShell-spawned `FolderBrowserDialog`** | Browsers can't expose absolute OS paths for a picked folder, so the server (which has real fs access) pops the native Windows dialog instead |
| System Tray | ~~Tauri system tray API~~ → **not built** | Impossible in a plain browser tab; see 5.7 |
| Global Hotkey | ~~tauri-plugin-global-shortcut~~ → **not built** | Same reason as System Tray |

---

## 8. Non-Functional Requirements

- **Performance**: Startup < 2 seconds. Responsive UI for typical usage (dozens of projects, hundreds of notes).
- **Data safety**: Auto-save with debounce. No data loss on crash. Files always on disk.
- **Portability**: Data folder is self-contained — can be copied, backed up, or moved to another machine.
- ~~**Low footprint**: < 50MB RAM when idle in tray~~ → not applicable, no tray (see 5.7)
- **No network**: Zero internet calls during normal use. (`npm install` itself needs network access once, to download packages — see [TASKS.md](TASKS.md) note about this not working on a network that blocks the npm registry.)
- ~~**Bundle size**: < 20MB installer (Tauri advantage)~~ → not applicable, no installer; it's `npm install` + `npm run dev`

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
9. ❌ System tray with global hotkey (quick note + screenshot) — **architecturally blocked**, see 5.7
10. ✅ User-configurable data folder location (with a native folder-browser dialog)
11. ✅ All user files stored as readable files on disk

---

## 11. Resolved Decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1 | App framework | ~~Tauri v2~~ → **Express + React local web app** (2026-06-24, corporate laptop can't install Tauri/Electron build tooling) |
| 2 | Data folder location | **User-configurable** (set on first launch, changeable in settings; native folder-browser dialog) |
| 3 | Canvas file format | **tldraw native format** — integration worked, no fallback needed |
| 4 | Note file extension | **User's choice** — can use `.txt`, `.md`, `.log`, or any extension |
| 5 | App metadata storage | ~~SQLite~~ → **plain JSON files** (2026-06-24, avoids native module builds) |
| 6 | System tray / global hotkey | **Dropped** (2026-06-24) — impossible in a browser tab; revisit only if the Tauri/Electron constraint changes |

---

*Document Version: 2.1*
*Status: Living document — see implementation note at top and [TASKS.md](TASKS.md) for current build status*
