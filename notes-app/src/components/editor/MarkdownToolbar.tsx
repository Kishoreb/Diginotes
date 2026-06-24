import { Bold, Code, Heading2, Italic, List } from "lucide-react";
import { EditorView } from "@codemirror/view";
import { prefixLines, wrapSelection } from "../../lib/markdownEditing";

interface MarkdownToolbarProps {
  getView: () => EditorView | undefined;
}

function MarkdownToolbar({ getView }: MarkdownToolbarProps) {
  const run = (action: (view: EditorView) => void) => {
    const view = getView();
    if (view) action(view);
  };

  const buttons = [
    { icon: Bold, title: "Bold", action: (v: EditorView) => wrapSelection(v, "**", "**") },
    { icon: Italic, title: "Italic", action: (v: EditorView) => wrapSelection(v, "*", "*") },
    { icon: Heading2, title: "Heading", action: (v: EditorView) => prefixLines(v, "## ") },
    { icon: List, title: "Bullet list", action: (v: EditorView) => prefixLines(v, "- ") },
    { icon: Code, title: "Inline code", action: (v: EditorView) => wrapSelection(v, "`", "`") },
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-1 border-b border-slate-200 bg-slate-50">
      {buttons.map(({ icon: Icon, title, action }) => (
        <button
          key={title}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run(action)}
          title={title}
          className="text-slate-500 hover:text-indigo-600 hover:bg-slate-200 rounded p-1.5 transition-colors"
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

export default MarkdownToolbar;
