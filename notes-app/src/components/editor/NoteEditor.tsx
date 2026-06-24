import { useEffect, useState, useRef, useCallback } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { api } from "../../lib/api";
import { FileTypeIcon } from "../../lib/fileIcons";
import MarkdownToolbar from "./MarkdownToolbar";

interface NoteEditorProps {
  filePath: string;
  onWordCountChange?: (count: number) => void;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function NoteEditor({ filePath, onWordCountChange }: NoteEditorProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");
  const [loadError, setLoadError] = useState("");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef("");
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  useEffect(() => {
    setLoadError("");
    api
      .readNote(filePath)
      .then((text) => {
        setContent(text);
        contentRef.current = text;
        setLastSaved("");
        onWordCountChange?.(countWords(text));
      })
      .catch((e) => setLoadError(`Failed to load note: ${e}`));
  }, [filePath]);

  const doSave = useCallback(
    async (value: string) => {
      setSaving(true);
      try {
        await api.saveNote(filePath, value);
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Save failed:", err);
      }
      setSaving(false);
    },
    [filePath]
  );

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
      contentRef.current = value;
      onWordCountChange?.(countWords(value));

      // Debounced auto-save
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => doSave(value), 800);
    },
    [doSave, onWordCountChange]
  );

  // Ctrl+S forces an immediate save instead of waiting for the debounce.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        doSave(contentRef.current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [doSave]);

  const fileName = filePath.split(/[/\\]/).pop() || "Untitled";
  const isMarkdown = fileName.endsWith(".md");
  const showFormattingToolbar = isMarkdown || fileName.endsWith(".txt");

  if (loadError) {
    return <div className="flex-1 flex items-center justify-center text-red-500 text-sm">{loadError}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileTypeIcon fileName={fileName} /> {fileName}
        </span>
        <span className="text-xs text-slate-400">
          {saving ? "Saving..." : lastSaved ? `Saved at ${lastSaved}` : ""}
        </span>
      </div>
      {showFormattingToolbar && <MarkdownToolbar getView={() => editorRef.current?.view} />}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          ref={editorRef}
          value={content}
          height="100%"
          onChange={handleChange}
          extensions={isMarkdown ? [markdown(), EditorView.lineWrapping] : [EditorView.lineWrapping]}
        />
      </div>
    </div>
  );
}

export default NoteEditor;
