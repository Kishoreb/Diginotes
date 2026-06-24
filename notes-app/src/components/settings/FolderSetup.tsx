import { useState } from "react";
import { api } from "../../lib/api";

interface FolderSetupProps {
  onComplete: (path: string) => void;
}

function FolderSetup({ onComplete }: FolderSetupProps) {
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleConfirm = async () => {
    if (!selectedPath) {
      setError("Please enter a folder path.");
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
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Notes App</h1>
        <p className="text-gray-600 mb-6">
          Enter the folder path where your projects, notes, and files will be stored.
          You can change this later in settings.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Folder Path
          </label>
          <input
            type="text"
            value={selectedPath}
            onChange={(e) => { setSelectedPath(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. C:\Users\YourName\Documents\NotesApp"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Folder will be created if it doesn't exist.</p>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={!selectedPath}
          className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default FolderSetup;
