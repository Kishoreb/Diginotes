import { useEffect, useState, useRef } from "react";
import { api } from "../../lib/api";

interface NoteEditorProps {
  filePath: string;
}

function NoteEditor({ filePath }: NoteEditorProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.readNote(filePath).then((text) => {
      setContent(text);
      setLastSaved("");
    });
  }, [filePath]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Debounced auto-save
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      try {
        await api.saveNote(filePath, newContent);
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Save failed:", err);
      }
      setSaving(false);
    }, 800);
  };

  const fileName = filePath.split(/[/\\]/).pop() || "Untitled";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-sm font-medium text-gray-700">📄 {fileName}</span>
        <span className="text-xs text-gray-400">
          {saving ? "Saving..." : lastSaved ? `Saved at ${lastSaved}` : ""}
        </span>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        className="flex-1 p-4 font-mono text-sm resize-none outline-none bg-white"
        placeholder="Start typing..."
        spellCheck={false}
      />
    </div>
  );
}

export default NoteEditor;
