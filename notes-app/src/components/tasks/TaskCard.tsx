import { CalendarDays, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../../types";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.dueDate && task.column !== "done" && new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md cursor-grab group relative transition-shadow"
      onClick={onEdit}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-0.5 rounded"
        title="Delete task"
      >
        <X size={13} />
      </button>
      <p className="text-sm font-medium text-slate-800 pr-4 break-words">{task.title}</p>
      {task.description && (
        <p className="text-xs text-slate-500 mt-1 break-words line-clamp-3">{task.description}</p>
      )}
      {task.dueDate && (
        <p className={`flex items-center gap-1 text-xs mt-2 ${isOverdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
          <CalendarDays size={12} /> {task.dueDate}
        </p>
      )}
    </div>
  );
}

export default TaskCard;
