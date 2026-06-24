import { useEffect, useState } from "react";
import { FolderOpen, KanbanSquare, Plus, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import { FolderEntry } from "../../types";
import TreeNode from "./TreeNode";

interface SidebarProps {
  dataFolder: string;
  onSelect: (entry: FolderEntry) => void;
  refreshKey?: number;
}

function Sidebar({ dataFolder, onSelect, refreshKey }: SidebarProps) {
  const [tree, setTree] = useState<FolderEntry[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState("");

  const refreshTree = async () => {
    try {
      const entries = await api.getProjectTree();
      setTree(entries);
    } catch (e) {
      console.error("Failed to load project tree:", e);
    }
  };

  useEffect(() => {
    refreshTree();
  }, [dataFolder, refreshKey]);

  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name) {
      setError("Name cannot be empty");
      return;
    }
    try {
      await api.createProject(name);
      setNewProjectName("");
      setShowNewProject(false);
      setError("");
      refreshTree();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateProject();
    } else if (e.key === "Escape") {
      setShowNewProject(false);
      setNewProjectName("");
      setError("");
    }
  };

  return (
    <div className="w-64 h-full bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Projects</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setShowNewProject(true)}
            className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded p-1 transition-colors"
            title="New Project"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={refreshTree}
            className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded p-1 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {showNewProject && (
        <div className="p-2 border-b border-slate-200">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Project name"
            autoFocus
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-indigo-400"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <div className="flex gap-1 mt-1">
            <button
              onClick={handleCreateProject}
              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => { setShowNewProject(false); setNewProjectName(""); setError(""); }}
              className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 && (
          <p className="text-xs text-slate-400 p-2">No projects yet. Click + to create one.</p>
        )}
        {tree.map((entry) => (
          <div key={entry.path}>
            <TreeNode
              entry={entry}
              depth={0}
              onSelect={onSelect}
              onTreeChanged={refreshTree}
            />
            <div
              className="flex items-center gap-2 py-1 px-2 hover:bg-slate-200/70 cursor-pointer rounded-md text-sm transition-colors"
              style={{ paddingLeft: "24px" }}
              onClick={() => onSelect({ name: "Task Board", path: entry.path, isDir: false, isTaskBoard: true })}
            >
              <KanbanSquare size={15} className="text-teal-500" />
              <span className="text-slate-500">Task Board</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-1.5 px-3 py-2 border-t border-slate-200 text-xs text-slate-400 truncate"
        title={dataFolder}
      >
        <FolderOpen size={12} className="shrink-0" />
        <span className="truncate">{dataFolder}</span>
      </div>
    </div>
  );
}

export default Sidebar;
