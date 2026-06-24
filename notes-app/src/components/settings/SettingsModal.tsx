import { useState } from "react";
import { FolderOpen, Settings } from "lucide-react";
import { api } from "../../lib/api";

interface SettingsModalProps {
  currentFolder: string;
  onClose: () => void;
  onFolderChanged: (newFolder: string) => void;
}

function SettingsModal({ currentFolder, onClose, onFolderChanged }: SettingsModalProps) {
  const [newPath, setNewPath] = useState(currentFolder);
  const [copyExisting, setCopyExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [error, setError] = useState("");

  const isUnchanged = newPath.trim() === currentFolder;

  const handleBrowse = async () => {
    setBrowsing(true);
    setError("");
    try {
      const picked = await api.pickFolder();
      if (picked) setNewPath(picked);
    } catch (e) {
      setError(`Failed to open folder picker: ${e}`);
    }
    setBrowsing(false);
  };

  const handleSave = async () => {
    const trimmed = newPath.trim();
    if (!trimmed) {
      setError("Folder path cannot be empty.");
      return;
    }
    if (trimmed === currentFolder) {
      onClose();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const folder = await api.changeDataFolder(trimmed, copyExisting);
      onFolderChanged(folder);
      onClose();
    } catch (e) {
      setError(`Failed to change data folder: ${e}`);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-[28rem] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-4">
          <Settings size={18} className="text-slate-500" /> Settings
        </h3>

        <label className="block text-sm font-medium text-slate-700 mb-1">Data Folder</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newPath}
            onChange={(e) => { setNewPath(e.target.value); setError(""); }}
            className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:border-indigo-400"
          />
          <button
            onClick={handleBrowse}
            disabled={browsing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <FolderOpen size={14} />
            {browsing ? "Opening..." : "Browse..."}
          </button>
        </div>

        {!isUnchanged && (
          <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <input
              type="checkbox"
              checked={copyExisting}
              onChange={(e) => setCopyExisting(e.target.checked)}
            />
            Copy existing projects/notes to the new folder
          </label>
        )}

        {!isUnchanged && !copyExisting && (
          <p className="text-xs text-amber-600 mb-2">
            Without copying, the new folder starts empty — your current projects stay at the old location on disk, but won't show in the app anymore.
          </p>
        )}

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
