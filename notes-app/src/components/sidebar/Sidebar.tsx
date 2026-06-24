import { useEffect, useState } from "react";
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
    <div className="w-64 h-full bg-gray-100 border-r border-gray-300 flex flex-col">
      <div className="p-3 border-b border-gray-300 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">Projects</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setShowNewProject(true)}
            className="text-gray-500 hover:text-gray-700 text-lg leading-none"
            title="New Project"
          >
            +
          </button>
          <button
            onClick={refreshTree}
            className="text-gray-500 hover:text-gray-700 text-sm"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {showNewProject && (
        <div className="p-2 border-b border-gray-300">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Project name"
            autoFocus
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <div className="flex gap-1 mt-1">
            <button
              onClick={handleCreateProject}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create
            </button>
            <button
              onClick={() => { setShowNewProject(false); setNewProjectName(""); setError(""); }}
              className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 && (
          <p className="text-xs text-gray-400 p-2">No projects yet. Click + to create one.</p>
        )}
        {tree.map((entry) => (
          <TreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            onSelect={onSelect}
            onTreeChanged={refreshTree}
          />
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
