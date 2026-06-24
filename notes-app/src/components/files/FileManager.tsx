import { useEffect, useState, useRef } from "react";
import { Folder, Pencil, Trash2, Upload } from "lucide-react";
import { api } from "../../lib/api";
import { FileTypeIcon } from "../../lib/fileIcons";

interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: string;
  extension: string;
}

interface FileManagerProps {
  folderPath: string;
  onTreeChanged: () => void;
}

function FileManager({ folderPath, onTreeChanged }: FileManagerProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const loadFiles = async () => {
    try {
      const list = await api.listFiles(folderPath);
      setFiles(list);
    } catch (e) {
      console.error("Failed to list files:", e);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [folderPath]);

  const handleFileUpload = async (fileList: FileList) => {
    for (const file of Array.from(fileList)) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          await api.uploadFile(folderPath, file.name, base64);
          loadFiles();
          onTreeChanged();
        } catch (e) {
          alert(`Upload failed: ${e}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (!blob) continue;
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            await api.saveScreenshot(folderPath, base64);
            loadFiles();
            onTreeChanged();
          } catch (err) {
            alert(`Screenshot save failed: ${err}`);
          }
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  const handleOpen = async (filePath: string) => {
    try {
      await api.openFile(filePath);
    } catch (e) {
      alert(`Failed to open file: ${e}`);
    }
  };

  const startRename = (file: FileInfo) => {
    setRenamingPath(file.path);
    setRenameValue(file.name);
  };

  const cancelRename = () => {
    setRenamingPath(null);
    setRenameValue("");
  };

  const confirmRename = async () => {
    if (!renamingPath) return;
    const newName = renameValue.trim();
    const current = files.find((f) => f.path === renamingPath);
    if (!newName || !current || newName === current.name) {
      cancelRename();
      return;
    }
    try {
      await api.renameEntry(renamingPath, newName);
      cancelRename();
      loadFiles();
      onTreeChanged();
    } catch (e) {
      alert(`Rename failed: ${e}`);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") confirmRename();
    if (e.key === "Escape") cancelRename();
  };

  const handleDelete = async (file: FileInfo) => {
    const confirmed = window.confirm(`Delete "${file.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await api.deleteEntry(file.path);
      loadFiles();
      onTreeChanged();
    } catch (e) {
      alert(`Delete failed: ${e}`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const folderName = folderPath.split(/[/\\]/).pop() || "Files";

  return (
    <div
      className="flex flex-col h-full"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Folder size={16} className="text-indigo-400" /> {folderName}
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Upload size={13} /> Add File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      <div
        className={`flex-1 overflow-y-auto p-4 ${dragOver ? "bg-indigo-50 border-2 border-dashed border-indigo-400" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {files.length === 0 && (
          <div className="text-center text-slate-400 mt-8">
            <Upload size={28} className="mx-auto mb-2 text-slate-300" />
            <p>No files yet.</p>
            <p className="text-xs mt-1">Drag & drop files here, click "Add File", or paste a screenshot (Ctrl+V).</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-1">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between px-3 py-2 hover:bg-slate-100 rounded-md cursor-pointer group transition-colors"
              onDoubleClick={() => renamingPath !== file.path && handleOpen(file.path)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileTypeIcon fileName={file.name} size={18} />
                {renamingPath === file.path ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={confirmRename}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="flex-1 px-1 py-0 text-sm border border-indigo-400 rounded outline-none"
                  />
                ) : (
                  <span className="text-sm truncate text-slate-700">{file.name}</span>
                )}
              </div>
              {renamingPath !== file.path && (
                <>
                  <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">{formatSize(file.size)}</span>
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(file); }}
                      className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-200"
                      title="Rename"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                      className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-200"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FileManager;
