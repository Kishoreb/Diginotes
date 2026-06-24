import { useCallback, useRef } from "react";
import { Palette } from "lucide-react";
import { Editor, getSnapshot, loadSnapshot, Tldraw, TLEditorSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { api } from "../../lib/api";

interface CanvasProps {
  filePath: string;
}

// Bounded canvas per SPEC.md (5.3): "large but not infinite" drawing surface.
const CANVAS_BOUNDS = { x: 0, y: 0, w: 4000, h: 3000 };

function Canvas({ filePath }: CanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const snapshot = getSnapshot(editor.store);
    api.saveNote(filePath, JSON.stringify(snapshot)).catch((e) => {
      console.error("Failed to save canvas:", e);
    });
  }, [filePath]);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      editor.setCameraOptions({
        constraints: {
          bounds: CANVAS_BOUNDS,
          padding: { x: 40, y: 40 },
          origin: { x: 0.5, y: 0.5 },
          initialZoom: "fit-x",
          baseZoom: "default",
          behavior: "contain",
        },
      });

      api
        .readNote(filePath)
        .then((content) => {
          if (content.trim()) {
            const snapshot: TLEditorSnapshot = JSON.parse(content);
            loadSnapshot(editor.store, snapshot);
          }
        })
        .catch((e) => console.error("Failed to load canvas:", e));

      editor.store.listen(
        () => {
          if (saveTimeout.current) clearTimeout(saveTimeout.current);
          saveTimeout.current = setTimeout(persist, 800);
        },
        { source: "user", scope: "document" }
      );
    },
    [filePath, persist]
  );

  const fileName = filePath.split(/[/\\]/).pop() || "Untitled";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-2 border-b border-slate-200 bg-slate-50">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Palette size={16} className="text-purple-500" /> {fileName}
        </span>
      </div>
      <div className="flex-1 relative">
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
}

export default Canvas;
