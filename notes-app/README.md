# Notes App

A local notes-taking app organized by projects: plain-text notes, a tldraw whiteboard, file attachments, a kanban task board, and full-text search. Runs as a local web server + browser UI — see [SPEC.md](../SPEC.md) for the full design doc and [TASKS.md](../TASKS.md) for what's built vs. pending.

All your data is stored as plain files on disk, inside whatever folder you choose — nothing proprietary, nothing locked in.

## Prerequisites

- Node.js v18+
- A network connection that can reach `registry.npmjs.org`, **just for the one-time `npm install`** (the app itself makes zero network calls afterward)

### If `npm install` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

This means something on your machine is intercepting HTTPS traffic for SSL scanning (e.g. Norton Antivirus, or a corporate proxy) and Node doesn't trust its certificate. Fix:

1. Export that root certificate to a `.pem` file (ask whoever set up the interception, or find it in Windows' certificate store under "Trusted Root Certification Authorities").
2. Point Node at it for the install:
   ```powershell
   $env:NODE_EXTRA_CA_CERTS = "C:\path\to\that-root-cert.pem"
   npm install
   ```

If you're on a network that blocks `npm install` outright (e.g. a locked-down corporate network), you won't be able to add new dependencies from there — see the note in [TASKS.md](../TASKS.md) about `node_modules` not being tracked by git, so packages installed elsewhere don't transfer via `git pull` alone.

## Setup

```bash
cd notes-app
npm install
```

## Run (Development)

```bash
npm run dev
```

This starts:
- Vite dev server at `http://localhost:1420` (frontend)
- Express API server at `http://localhost:3001` (backend)

Open `http://localhost:1420` in your browser. Leave both running in the terminal while you use the app.

## First Launch

1. Click **Browse...** to pick a folder where your data will be stored (or type a path), e.g. `D:\MyNotes` — this opens the actual Windows folder picker
2. Click "Get Started"
3. Start creating projects!

You can change this later via the ⚙️ Settings button in the top toolbar, with an option to copy your existing data to the new location.

## Features

- **Projects & folders** — sidebar tree, unlimited nested sub-folders, right-click to rename/delete/create. Drag and drop any note, canvas, file, or folder onto another folder to move it there.
- **Notes** — CodeMirror 6 editor with line numbers, auto-save (Ctrl+S to force an immediate save), find & replace (Ctrl+F). `.md` and `.txt` notes get a small formatting toolbar (bold/italic/heading/bullet list/inline code) that inserts plain markdown syntax — files stay readable plain text, no hidden formatting.
- **Canvas** — tldraw whiteboard (drawing, shapes, sticky notes, image paste), bounded to a 4000×3000 area, saved as `.tldr` files.
- **Task board** — kanban (To Do / In Progress / Done) per project, drag and drop between columns, stored as a `tasks.json` file alongside that project's notes.
- **Search** — Ctrl+K to focus the search bar, live results across every note as you type.
- **Files** — drag & drop or paste-from-clipboard to add files/screenshots, double-click to open with the default Windows app, rename/delete from the file list.
- **Settings** — change the data folder (with a real folder-browser dialog), optionally copying existing data to the new location.

## What's not built

- System tray / global hotkey — not possible in a plain browser tab; would need a Tauri/Electron rewrite (deliberately avoided, see [SPEC.md](../SPEC.md) implementation note)
- In-app file preview (images/PDFs), themes, note templates — see SPEC.md Section 9 for the full deferred list

## Data layout on disk

```
<your-chosen-data-folder>/
├── projects/
│   └── ProjectName/
│       ├── notes/
│       ├── canvases/      (.tldr files)
│       ├── files/         (attachments, pasted screenshots)
│       └── tasks.json     (task board for this project)
└── config.json
```

The app remembers which folder you chose in `%APPDATA%\NotesApp\launcher.json`.
