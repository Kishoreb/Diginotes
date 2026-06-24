# Implementation Tasks - Broken into Small Chunks

## Phase 0: Project Scaffolding
- [ ] 0.1 Initialize Tauri v2 project with React + TypeScript + Vite
- [ ] 0.2 Add Tailwind CSS
- [ ] 0.3 Set up project folder structure (src/components, src/pages, etc.)
- [ ] 0.4 Verify app builds and launches on Windows

## Phase 1: Data Folder & Config
- [ ] 1.1 First-launch screen: let user pick data folder location
- [ ] 1.2 Store chosen path in `%APPDATA%\NotesApp\launcher.json`
- [ ] 1.3 On startup, read launcher.json and validate data folder exists
- [ ] 1.4 Create initial folder structure (`projects/`, `config.json`) if missing

## Phase 2: Sidebar & Project Management
- [ ] 2.1 Sidebar component (collapsible tree)
- [ ] 2.2 Create new project (creates folder on disk)
- [ ] 2.3 Rename / delete project
- [ ] 2.4 Create sub-folders within a project
- [ ] 2.5 Display folder tree by reading filesystem

## Phase 3: Note Editor
- [ ] 3.1 Integrate CodeMirror 6 (plain text mode)
- [ ] 3.2 Create new note (user picks name + extension)
- [ ] 3.3 Open note from sidebar → load file content into editor
- [ ] 3.4 Auto-save with debounce (write to disk)
- [ ] 3.5 Delete / rename note
- [ ] 3.6 Find & replace within editor

## Phase 4: File Management
- [ ] 4.1 File list view for a folder (show files with icons)
- [ ] 4.2 Add file (copy into project folder via file picker)
- [ ] 4.3 Drag & drop file import
- [ ] 4.4 Double-click → open with default Windows app
- [ ] 4.5 Delete / rename files
- [ ] 4.6 Paste screenshot from clipboard → save as PNG to folder

## Phase 5: Canvas / Whiteboard
- [ ] 5.1 Integrate tldraw React component
- [ ] 5.2 Create new canvas (user names it)
- [ ] 5.3 Save canvas state to `.tldr` file on disk
- [ ] 5.4 Load canvas from `.tldr` file
- [ ] 5.5 Paste image from clipboard onto canvas
- [ ] 5.6 Bounded canvas (restrict pan/zoom area)
- [ ] 5.7 If tldraw too complex → build custom canvas (fallback plan)

## Phase 6: Task Board
- [ ] 6.1 Set up SQLite via tauri-plugin-sql
- [ ] 6.2 Create tasks table schema (id, project, title, description, due_date, column, position)
- [ ] 6.3 Kanban UI with 3 columns (To Do, In Progress, Done)
- [ ] 6.4 Create / edit / delete tasks
- [ ] 6.5 Drag & drop between columns (dnd-kit)
- [ ] 6.6 Reorder within columns

## Phase 7: Search
- [ ] 7.1 Set up SQLite FTS5 virtual table for notes
- [ ] 7.2 Index note content on create/save/delete
- [ ] 7.3 Search bar UI in toolbar
- [ ] 7.4 Display results (file name, project, snippet)
- [ ] 7.5 Click result → navigate to note

## Phase 8: System Tray & Global Hotkey
- [ ] 8.1 Minimize to system tray on close
- [ ] 8.2 Tray right-click menu (Open, Quick Note, Quit)
- [ ] 8.3 Register global hotkey (Ctrl+Shift+N)
- [ ] 8.4 Quick note popup (small window, save to default project)
- [ ] 8.5 Quick screenshot hotkey (clipboard → save to project)

## Phase 9: Settings & Polish
- [ ] 9.1 Settings page (change data folder, hotkey, default project)
- [ ] 9.2 Data folder migration (copy files if user changes location)
- [ ] 9.3 Status bar (current path, word count)
- [ ] 9.4 Keyboard shortcuts for common actions
- [ ] 9.5 Error handling & edge cases

---

## Build Order (recommended)

Start with **Phase 0 → 1 → 2 → 3** to get a working notes app fast.
Then add **4 → 5 → 6 → 7 → 8 → 9** incrementally.

Each task is small enough to implement in one conversation turn.
Ask me to do any specific task (e.g., "do 0.1") and I'll write the code.
