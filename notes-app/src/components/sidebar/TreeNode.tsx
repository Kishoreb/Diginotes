import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Pencil, FolderPlus, Palette, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { FolderEntry } from "../../types";
import { FileTypeIcon } from "../../lib/fileIcons";

interface TreeNodeProps {
  entry: FolderEntry;
  depth: number;
  onSelect: (entry: FolderEntry) => void;
  onTreeChanged: () => void;
}

function TreeNode({ entry, depth, onSelect, onTreeChanged }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(entry.name);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingNote, setCreatingNote] = useState(false);
  const [newNoteName, setNewNoteName] = useState("");
  const [creatingCanvas, setCreatingCanvas] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const DRAG_MIME = "application/x-notesapp-path";

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_MIME, entry.path);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!entry.isDir || !e.dataTransfer.types.includes(DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = async (e: React.DragEvent) => {
    if (!entry.isDir) return;
    e.preventDefault();
    setDragOver(false);
    const sourcePath = e.dataTransfer.getData(DRAG_MIME);
    if (!sourcePath || sourcePath === entry.path) return;
    try {
      await api.moveEntry(sourcePath, entry.path);
      setExpanded(true);
      onTreeChanged();
    } catch (err) {
      alert(`Move failed: ${err}`);
    }
  };

  useEffect(() => {
    if (!showContext) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContext(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowContext(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showContext]);

  const handleClick = () => {
    if (entry.isDir) {
      setExpanded(!expanded);
    }
    onSelect(entry);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContext(!showContext);
  };

  const handleRename = async () => {
    const newName = renameValue.trim();
    if (!newName || newName === entry.name) {
      setRenaming(false);
      setRenameValue(entry.name);
      return;
    }
    try {
      await api.renameEntry(entry.path, newName);
      setRenaming(false);
      onTreeChanged();
    } catch (e) {
      alert(`Rename failed: ${e}`);
      setRenameValue(entry.name);
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${entry.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await api.deleteEntry(entry.path);
      setShowContext(false);
      onTreeChanged();
    } catch (e) {
      alert(`Delete failed: ${e}`);
    }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      setCreatingFolder(false);
      return;
    }
    try {
      await api.createFolder(entry.path, name);
      setCreatingFolder(false);
      setNewFolderName("");
      setExpanded(true);
      onTreeChanged();
    } catch (e) {
      alert(`Create folder failed: ${e}`);
    }
  };

  const handleCreateNote = async () => {
    const name = newNoteName.trim();
    if (!name) {
      setCreatingNote(false);
      return;
    }
    try {
      await api.createNote(entry.path, name);
      setCreatingNote(false);
      setNewNoteName("");
      setExpanded(true);
      onTreeChanged();
    } catch (e) {
      alert(`Create note failed: ${e}`);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRename();
    if (e.key === "Escape") { setRenaming(false); setRenameValue(entry.name); }
  };

  const handleNewFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreateFolder();
    if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
  };

  const handleNewNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreateNote();
    if (e.key === "Escape") { setCreatingNote(false); setNewNoteName(""); }
  };

  const handleCreateCanvas = async () => {
    const name = newCanvasName.trim();
    if (!name) {
      setCreatingCanvas(false);
      return;
    }
    const fileName = name.endsWith(".tldr") ? name : `${name}.tldr`;
    try {
      await api.createNote(entry.path, fileName);
      setCreatingCanvas(false);
      setNewCanvasName("");
      setExpanded(true);
      onTreeChanged();
    } catch (e) {
      alert(`Create canvas failed: ${e}`);
    }
  };

  const handleNewCanvasKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreateCanvas();
    if (e.key === "Escape") { setCreatingCanvas(false); setNewCanvasName(""); }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-slate-200/70 cursor-pointer rounded-md text-sm relative transition-colors ${
          dragOver ? "bg-indigo-100 ring-1 ring-indigo-400" : ""
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable={!renaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {entry.isDir ? (
          <span className="mr-1 text-slate-400 w-4 flex items-center justify-center">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="mr-1 w-4" />
        )}
        <span className="mr-2 flex items-center">
          {entry.isDir ? (
            expanded ? <FolderOpen size={16} className="text-indigo-400" /> : <Folder size={16} className="text-indigo-400" />
          ) : (
            <FileTypeIcon fileName={entry.name} />
          )}
        </span>

        {renaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRename}
            autoFocus
            className="flex-1 px-1 py-0 text-sm border border-indigo-400 rounded outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-slate-700">{entry.name}</span>
        )}
      </div>

      {showContext && (
        <div
          ref={contextMenuRef}
          className="absolute z-10 bg-white border border-slate-200 rounded-md shadow-lg py-1 min-w-[140px]"
          style={{ marginLeft: `${depth * 16 + 40}px` }}
        >
          {entry.isDir && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCreatingNote(true); setShowContext(false); setExpanded(true); }}
                className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                <FileTypeIcon fileName="note.txt" /> New Note
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCreatingCanvas(true); setShowContext(false); setExpanded(true); }}
                className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                <Palette size={14} className="text-purple-500" /> New Canvas
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCreatingFolder(true); setShowContext(false); setExpanded(true); }}
                className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                <FolderPlus size={14} className="text-indigo-400" /> New Folder
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setRenaming(true); setShowContext(false); }}
            className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Pencil size={14} /> Rename
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {entry.isDir && expanded && (
        <div>
          {creatingNote && (
            <div
              className="flex items-center py-1 px-2"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <span className="mr-2 flex items-center"><FileTypeIcon fileName="note.txt" /></span>
              <input
                type="text"
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
                onKeyDown={handleNewNoteKeyDown}
                onBlur={handleCreateNote}
                autoFocus
                placeholder="filename.txt"
                className="flex-1 px-1 py-0 text-sm border border-indigo-400 rounded outline-none"
              />
            </div>
          )}
          {creatingCanvas && (
            <div
              className="flex items-center py-1 px-2"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <span className="mr-2 flex items-center"><Palette size={14} className="text-purple-500" /></span>
              <input
                type="text"
                value={newCanvasName}
                onChange={(e) => setNewCanvasName(e.target.value)}
                onKeyDown={handleNewCanvasKeyDown}
                onBlur={handleCreateCanvas}
                autoFocus
                placeholder="canvas name"
                className="flex-1 px-1 py-0 text-sm border border-indigo-400 rounded outline-none"
              />
            </div>
          )}
          {creatingFolder && (
            <div
              className="flex items-center py-1 px-2"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <span className="mr-2 flex items-center"><Folder size={16} className="text-indigo-400" /></span>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleNewFolderKeyDown}
                onBlur={handleCreateFolder}
                autoFocus
                placeholder="Folder name"
                className="flex-1 px-1 py-0 text-sm border border-indigo-400 rounded outline-none"
              />
            </div>
          )}
          {entry.children && entry.children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              onSelect={onSelect}
              onTreeChanged={onTreeChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TreeNode;
