import { useEffect, useState, useCallback } from "react";
import { api } from "./lib/api";
import FolderSetup from "./components/settings/FolderSetup";
import Sidebar from "./components/sidebar/Sidebar";
import NoteEditor from "./components/editor/NoteEditor";
import FileManager from "./components/files/FileManager";
import { FolderEntry } from "./types";

function App() {
  const [dataFolder, setDataFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<FolderEntry | null>(null);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);

  useEffect(() => {
    api.getDataFolder()
      .then((folder) => {
        setDataFolder(folder);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const triggerTreeRefresh = useCallback(() => {
    setTreeRefreshKey((k) => k + 1);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!dataFolder) {
    return <FolderSetup onComplete={(path) => setDataFolder(path)} />;
  }

  const isNoteFile = selectedEntry && !selectedEntry.isDir;
  const isFolder = selectedEntry && selectedEntry.isDir;

  return (
    <div className="h-screen flex">
      <Sidebar
        dataFolder={dataFolder}
        onSelect={setSelectedEntry}
        refreshKey={treeRefreshKey}
      />
      <div className="flex-1 flex flex-col bg-white">
        {isNoteFile ? (
          <NoteEditor key={selectedEntry.path} filePath={selectedEntry.path} />
        ) : isFolder ? (
          <FileManager
            key={selectedEntry.path}
            folderPath={selectedEntry.path}
            onTreeChanged={triggerTreeRefresh}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">Select a file or folder from the sidebar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
