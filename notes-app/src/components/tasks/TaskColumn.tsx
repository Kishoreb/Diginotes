import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskColumn as TaskColumnType } from "../../types";
import TaskCard from "./TaskCard";

interface TaskColumnProps {
  id: TaskColumnType;
  title: string;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

function TaskColumn({ id, title, tasks, onAddTask, onEditTask, onDeleteTask }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-72 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-600">
          {title} <span className="text-slate-400 font-normal">({tasks.length})</span>
        </h3>
        <button
          onClick={onAddTask}
          className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded p-0.5 transition-colors"
          title="Add task"
        >
          <Plus size={16} />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px] transition-colors ${isOver ? "bg-indigo-50" : ""}`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="text-xs text-slate-400 text-center mt-4">No tasks</p>
        )}
      </div>
    </div>
  );
}

export default TaskColumn;
