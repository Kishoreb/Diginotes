import { useState } from "react";
import { Task } from "../../types";

interface TaskModalProps {
  task: Partial<Task> | null;
  onSave: (data: { title: string; description: string; dueDate: string }) => void;
  onClose: () => void;
}

function TaskModal({ task, onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), dueDate });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-96 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          {task?.id ? "Edit Task" : "New Task"}
        </h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          autoFocus
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md mb-2 outline-none focus:border-indigo-400"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={3}
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md mb-2 outline-none focus:border-indigo-400 resize-none"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md mb-3 outline-none focus:border-indigo-400"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
