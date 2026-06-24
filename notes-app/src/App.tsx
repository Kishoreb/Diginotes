import { useEffect, useState, useCallback, useRef } from "react";
import { NotebookPen, Settings, WifiOff } from "lucide-react";
import { api } from "./lib/api";
import FolderSetup from "./components/settings/FolderSetup";
import Sidebar from "./components/sidebar/Sidebar";
import NoteEditor from "./components/editor/NoteEditor";
import FileManager from "./components/files/FileManager";
import TaskBoard from "./components/tasks/TaskBoard";
import Canvas from "./components/canvas/Canvas";
import SearchBar, { SearchBarHandle } from "./components/search/SearchBar";
import SettingsModal from "./components/settings/SettingsModal";
import { FolderEntry } from "./types";

function App() {
  const [dataFolder, setDataFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FolderEntry | null>(null);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const searchRef = useRef<SearchBarHandle>(null);

  useEffect(() => {
    api.getDataFolder()
      .then((folder) => {
        setDataFolder(folder);
        setLoading(false);
      })
      .catch(() => {
        setServerError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setWordCount(null);
  }, [selectedEntry?.path]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerTreeRefresh = useCallback(() => {
    setTreeRefreshKey((k) => k + 1);
  }, []);

  const handleSearchSelect = useCallback((notePath: string) => {
    const name = notePath.split(/[/\\]/).pop() || notePath;
    setSelectedEntry({ name, path: notePath, isDir: false });
  }, []);

  const handleFolderChanged = useCallback((newFolder: string) => {
    setDataFolder(newFolder);
    setSelectedEntry(null);
    triggerTreeRefresh();
  }, [triggerTreeRefresh]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (serverError) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm">
          <WifiOff size={28} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-500 font-medium mb-2">Could not reach the local server.</p>
          <p className="text-slate-500 text-sm">
            Make sure it's running (<code className="bg-slate-100 px-1 rounded">npm run dev</code>), then refresh this page.
          </p>
        </div>
      </div>
    );
  }

  if (!dataFolder) {
    return <FolderSetup onComplete={(path) => setDataFolder(path)} />;
  }

  const isTaskBoard = selectedEntry && selectedEntry.isTaskBoard;
  const isCanvas = selectedEntry && !selectedEntry.isDir && !selectedEntry.isTaskBoard && selectedEntry.name.endsWith(".tldr");
  const isNoteFile = selectedEntry && !selectedEntry.isDir && !selectedEntry.isTaskBoard && !isCanvas;
  const isFolder = selectedEntry && selectedEntry.isDir;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm pl-1">
          <NotebookPen size={18} className="text-indigo-600" />
          Notes App
        </div>
        <div className="flex items-center gap-3">
          <SearchBar ref={searchRef} onSelectResult={handleSearchSelect} />
          <button
            onClick={() => setShowSettings(true)}
            className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md p-1.5 transition-colors"
            title="Settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        <Sidebar
          dataFolder={dataFolder}
          onSelect={setSelectedEntry}
          refreshKey={treeRefreshKey}
        />
        <div className="flex-1 flex flex-col bg-white">
          {isTaskBoard ? (
            <TaskBoard key={selectedEntry.path} projectPath={selectedEntry.path} />
          ) : isCanvas ? (
            <Canvas key={selectedEntry.path} filePath={selectedEntry.path} />
          ) : isNoteFile ? (
            <NoteEditor key={selectedEntry.path} filePath={selectedEntry.path} onWordCountChange={setWordCount} />
          ) : isFolder ? (
            <FileManager
              key={selectedEntry.path}
              folderPath={selectedEntry.path}
              onTreeChanged={triggerTreeRefresh}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <NotebookPen size={32} className="text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400">Select a file or folder from the sidebar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-1 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        <span className="truncate">{selectedEntry?.path || "No file selected"}</span>
        {isNoteFile && wordCount !== null && <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>}
      </div>

      {showSettings && (
        <SettingsModal
          currentFolder={dataFolder}
          onClose={() => setShowSettings(false)}
          onFolderChanged={handleFolderChanged}
        />
      )}
    </div>
  );
}

export default App;
