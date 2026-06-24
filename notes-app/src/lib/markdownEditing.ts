import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export function wrapSelection(view: EditorView, before: string, after: string) {
  const { state } = view;
  view.dispatch(
    state.update(
      state.changeByRange((range) => {
        const selected = state.sliceDoc(range.from, range.to);
        const insert = `${before}${selected}${after}`;
        return {
          changes: { from: range.from, to: range.to, insert },
          range: selected
            ? EditorSelection.range(range.from + before.length, range.from + before.length + selected.length)
            : EditorSelection.cursor(range.from + before.length),
        };
      })
    )
  );
  view.focus();
}

export function prefixLines(view: EditorView, prefix: string) {
  const { state } = view;
  view.dispatch(
    state.update(
      state.changeByRange((range) => {
        const startLine = state.doc.lineAt(range.from);
        const endLine = state.doc.lineAt(range.to);
        const changes = [];
        for (let lineNo = startLine.number; lineNo <= endLine.number; lineNo++) {
          changes.push({ from: state.doc.line(lineNo).from, insert: prefix });
        }
        const lineCount = endLine.number - startLine.number + 1;
        return {
          changes,
          range: EditorSelection.range(range.from + prefix.length, range.to + prefix.length * lineCount),
        };
      })
    )
  );
  view.focus();
}
