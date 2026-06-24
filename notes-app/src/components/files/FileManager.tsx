import { useEffect, useState, useRef } from "react";
import { api } from "../../lib/api";

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
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-sm font-medium text-gray-700">📁 {folderName}</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add File
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
        className={`flex-1 overflow-y-auto p-4 ${dragOver ? "bg-blue-50 border-2 border-dashed border-blue-400" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {files.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p>No files yet.</p>
            <p className="text-xs mt-1">Drag & drop files here, click "Add File", or paste a screenshot (Ctrl+V).</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-1">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
              onDoubleClick={() => handleOpen(file.path)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">
                  {file.extension.match(/\.(png|jpg|jpeg|gif|bmp|svg)/) ? "🖼️" :
                   file.extension === ".pdf" ? "📕" :
                   file.extension.match(/\.(doc|docx)/) ? "📘" :
                   file.extension.match(/\.(xls|xlsx)/) ? "📗" :
                   "📎"}
                </span>
                <span className="text-sm truncate">{file.name}</span>
              </div>
              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{formatSize(file.size)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FileManager;
