# Implementation Tasks - Broken into Small Chunks

> **Architecture note (deviates from SPEC.md):** Built as a local web app —
> Express server (`server/index.js`) + React/Vite frontend in a browser tab —
> instead of Tauri. Decision: the corporate laptop this was originally built
> on cannot install Tauri/Electron build tooling. No SQLite either; app
> metadata (tasks) lives in plain JSON files alongside notes/canvases/files.
> This is a deliberate, confirmed deviation, not an oversight — keep
> following this pattern for remaining phases unless told otherwise.

## Phase 0: Project Scaffolding
- [x] 0.1 ~~Initialize Tauri v2 project~~ → Express + React + TypeScript + Vite (see note above)
- [x] 0.2 Add Tailwind CSS
- [x] 0.3 Set up project folder structure (src/components, server/, etc.)
- [x] 0.4 Verify app builds and launches (`npm run dev`, tested 2026-06-24)

## Phase 1: Data Folder & Config
- [x] 1.1 First-launch screen: let user pick data folder location
- [x] 1.2 Store chosen path in `%APPDATA%\NotesApp\launcher.json`
- [x] 1.3 On startup, read launcher.json and validate data folder exists
- [x] 1.4 Create initial folder structure (`projects/`, `config.json`) if missing

## Phase 2: Sidebar & Project Management
- [x] 2.1 Sidebar component (collapsible tree)
- [x] 2.2 Create new project (creates folder on disk)
- [x] 2.3 Rename / delete project
- [x] 2.4 Create sub-folders within a project
- [x] 2.5 Display folder tree by reading filesystem

## Phase 3: Note Editor
- [x] 3.1 Integrate CodeMirror 6 — via `@uiw/react-codemirror`, completed 2026-06-24. **Needs npm install** (`@uiw/react-codemirror`, `@codemirror/lang-markdown`, `codemirror`, `@codemirror/state`, `@codemirror/view`, `@codemirror/search`); confirm these can actually be installed before relying on this on the corporate laptop
- [x] 3.2 Create new note (user picks name + extension)
- [x] 3.3 Open note from sidebar → load file content into editor
- [x] 3.4 Auto-save with debounce (write to disk)
- [x] 3.5 Delete / rename note
- [x] 3.6 Find & replace within editor — built into CodeMirror's basicSetup (Ctrl+F opens search/replace panel)

## Phase 4: File Management
- [x] 4.1 File list view for a folder (show files with icons)
- [x] 4.2 Add file (copy into project folder via file picker)
- [x] 4.3 Drag & drop file import
- [x] 4.4 Double-click → open with default Windows app
- [x] 4.5 Delete / rename files — hover-revealed ✏️/🗑️ buttons directly in the file list, tested 2026-06-24 (previously only possible via the sidebar tree)
- [x] 4.6 Paste screenshot from clipboard → save as PNG to folder

## Phase 5: Canvas / Whiteboard
- [x] 5.1 Integrate tldraw React component (tldraw v5.1.1) — completed 2026-06-24
- [x] 5.2 Create new canvas (user names it, via "New Canvas" in sidebar context menu)
- [x] 5.3 Save canvas state to `.tldr` file on disk (debounced, via existing save-note endpoint — `.tldr` content is just JSON text)
- [x] 5.4 Load canvas from `.tldr` file
- [x] 5.5 Paste image from clipboard onto canvas — built into tldraw by default, not separately verified in-browser yet
- [x] 5.6 Bounded canvas (restrict pan/zoom area) — 4000×3000 page-space bounds via `editor.setCameraOptions`, `behavior: "contain"` keeps the board always visible — completed 2026-06-24
- [ ] 5.7 N/A — tldraw integration worked, fallback not needed

> Note: tldraw's free SDK license requires either a paid license or a small
> "Made with tldraw" watermark visible in the UI. Acceptable for this
> internal personal tool; revisit if that changes.

## Phase 6: Task Board
- [x] 6.1 ~~Set up SQLite~~ → tasks stored as `tasks.json` per project (see architecture note)
- [x] 6.2 Task schema (id, title, description, due_date, column, position, createdAt)
- [x] 6.3 Kanban UI with 3 columns (To Do, In Progress, Done)
- [x] 6.4 Create / edit / delete tasks
- [x] 6.5 Drag & drop between columns (dnd-kit) — completed 2026-06-24
- [x] 6.6 Reorder within columns

## Phase 7: Search
- [x] 7.1 ~~SQLite FTS5~~ → no index at all; server reads note files on demand at search time (capped at 5MB/file so one huge note can't block the server) — simpler than an index and avoids keeping it in sync, fine at this app's scale
- [x] 7.2 N/A — nothing to index since there's no index; always reflects current file contents
- [x] 7.3 Search bar UI in toolbar (top-right, Ctrl+K to focus)
- [x] 7.4 Display results (file name, project, snippet) with debounced live search
- [x] 7.5 Click result → navigate to note — completed and tested 2026-06-24

## Phase 8: System Tray & Global Hotkey
- [ ] 8.1-8.5 **Not possible as a plain browser web app** (no OS tray/hotkey APIs from JS in a browser tab). Would require Tauri/Electron, which is ruled out on the corporate laptop — revisit if requirements change.

## Phase 9: Settings & Polish
- [x] 9.1 Settings page — gear icon in toolbar, change data folder (hotkey/default-project settings dropped: no tray/hotkey or quick-note feature exists to use them — see Phase 8)
- [x] 9.2 Data folder migration (copy files if user changes location) — checkbox to copy existing data or just point at a fresh empty folder, tested both paths 2026-06-24
- [x] 9.3 Status bar (current path, word count) — bottom bar, word count only shown for note files
- [x] 9.4 Keyboard shortcuts — Ctrl+S forces an immediate note save (bypasses the 800ms debounce); Ctrl+K focuses the search bar; Ctrl+F inside a note opens CodeMirror's find/replace panel
- [x] 9.5 Error handling & edge cases — fixed a few silent-failure spots: app now shows a clear "can't reach local server" screen instead of misleadingly showing first-launch setup; Task Board and note loading show an inline error instead of hanging on "Loading..." forever if the read fails
- [x] 9.6 Folder picker (added after initial 9.1) — first-launch and Settings "Browse..." button now opens the real Windows folder dialog via a PowerShell-spawned `FolderBrowserDialog` (server has fs access, browsers can't expose absolute paths). Fixed 2026-06-24: dialog was opening behind other windows since it had no parent — now uses an invisible topmost owner window to force it to the front. **User should verify by actually clicking Browse** — I deliberately didn't trigger it via API testing since that pops a real dialog on screen.
- [x] 9.7 Sidebar now always shows the current data folder path at the bottom (previously only visible by opening Settings) — fixes user confusion about where files live on disk
- [x] 9.8 Fixed: right-click context menu in the sidebar tree (New Note/Canvas/Folder, Rename, Delete) had no Escape or click-outside handler — it never closed except by clicking a menu item. Now closes on both.
- [x] 9.9 Simple markdown formatting toolbar for `.md` and `.txt` notes — Bold/Italic/Heading/Bullet list/Inline code buttons insert markdown syntax at the cursor via CodeMirror's API. Kept files as plain readable text (no rich-text storage) per a deliberate decision to preserve the spec's "plain text only" rule — color formatting was dropped since it doesn't map to plain markdown. Extended to `.txt` 2026-06-24 (was `.md`-only at first).
- [x] 9.10 Drag-and-drop to move notes/folders/files between project folders in the sidebar tree — native HTML5 drag-and-drop (no new dependency), new `/api/move-entry` backend endpoint. Guards tested: moving a folder into itself or its own subfolder is blocked, name collisions at the destination are blocked, dropping onto the same parent is a safe no-op.

---

## Build Order (recommended)

Start with **Phase 0 → 1 → 2 → 3** to get a working notes app fast.
Then add **4 → 5 → 6 → 7 → 8 → 9** incrementally.

Each task is small enough to implement in one conversation turn.
Ask me to do any specific task (e.g., "do 0.1") and I'll write the code.
