import { useState } from "react";
import { api } from "../../lib/api";
import { FolderEntry } from "../../types";

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

  return (
    <div>
      <div
        className="flex items-center py-1 px-2 hover:bg-gray-200 cursor-pointer rounded text-sm relative"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {entry.isDir && (
          <span className="mr-1 text-gray-500 w-4 text-center">
            {expanded ? "▼" : "▶"}
          </span>
        )}
        {!entry.isDir && <span className="mr-1 w-4" />}
        <span className="mr-2">{entry.isDir ? "📁" : "📄"}</span>

        {renaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRename}
            autoFocus
            className="flex-1 px-1 py-0 text-sm border border-blue-400 rounded outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate">{entry.name}</span>
        )}
      </div>

      {showContext && (
        <div
          className="absolute z-10 bg-white border border-gray-300 rounded shadow-md py-1"
          style={{ marginLeft: `${depth * 16 + 40}px` }}
        >
          {entry.isDir && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCreatingNote(true); setShowContext(false); setExpanded(true); }}
                className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
              >
                New Note
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCreatingFolder(true); setShowContext(false); setExpanded(true); }}
                className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
              >
                New Folder
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setRenaming(true); setShowContext(false); }}
            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
          >
            Rename
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 text-red-600"
          >
            Delete
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
              <span className="mr-2">📄</span>
              <input
                type="text"
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
                onKeyDown={handleNewNoteKeyDown}
                onBlur={handleCreateNote}
                autoFocus
                placeholder="filename.txt"
                className="flex-1 px-1 py-0 text-sm border border-blue-400 rounded outline-none"
              />
            </div>
          )}
          {creatingFolder && (
            <div
              className="flex items-center py-1 px-2"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <span className="mr-2">📁</span>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleNewFolderKeyDown}
                onBlur={handleCreateFolder}
                autoFocus
                placeholder="Folder name"
                className="flex-1 px-1 py-0 text-sm border border-blue-400 rounded outline-none"
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
