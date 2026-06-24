import { useState } from "react";
import { FolderOpen, NotebookPen } from "lucide-react";
import { api } from "../../lib/api";

interface FolderSetupProps {
  onComplete: (path: string) => void;
}

function FolderSetup({ onComplete }: FolderSetupProps) {
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [browsing, setBrowsing] = useState(false);
  const [error, setError] = useState<string>("");

  const handleBrowse = async () => {
    setBrowsing(true);
    setError("");
    try {
      const picked = await api.pickFolder();
      if (picked) setSelectedPath(picked);
    } catch (e) {
      setError(`Failed to open folder picker: ${e}`);
    }
    setBrowsing(false);
  };

  const handleConfirm = async () => {
    if (!selectedPath) {
      setError("Please choose a folder.");
      return;
    }
    try {
      await api.setDataFolder(selectedPath);
      onComplete(selectedPath);
    } catch (e) {
      setError(`Failed to set data folder: ${e}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-indigo-50 rounded-lg p-2">
            <NotebookPen size={22} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to Notes App</h1>
        </div>
        <p className="text-slate-500 mb-6">
          Choose the folder where your projects, notes, and files will be stored.
          You can change this later in settings.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Data Folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={selectedPath}
              onChange={(e) => { setSelectedPath(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="No folder chosen yet"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleBrowse}
              disabled={browsing}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <FolderOpen size={15} />
              {browsing ? "Opening..." : "Browse..."}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Folder will be created if it doesn't exist.</p>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={!selectedPath}
          className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default FolderSetup;
