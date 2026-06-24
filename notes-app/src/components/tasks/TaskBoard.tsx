import { useEffect, useState } from "react";
import { KanbanSquare } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { api } from "../../lib/api";
import { Task, TaskColumn as TaskColumnType } from "../../types";
import TaskColumnComponent from "./TaskColumn";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";

interface TaskBoardProps {
  projectPath: string;
}

const COLUMNS: { id: TaskColumnType; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

function TaskBoard({ projectPath }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalState, setModalState] = useState<{ task: Partial<Task> | null } | null>(null);
  const [loadError, setLoadError] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    api
      .getTasks(projectPath)
      .then((loaded) => setTasks(loaded))
      .catch((e) => setLoadError(`Failed to load tasks: ${e}`))
      .finally(() => setLoading(false));
  }, [projectPath]);

  const persist = (next: Task[]) => {
    setTasks(next);
    api.saveTasks(projectPath, next).catch((e) => console.error("Failed to save tasks:", e));
  };

  const tasksByColumn = (col: TaskColumnType) =>
    tasks.filter((t) => t.column === col).sort((a, b) => a.position - b.position);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overColumn = COLUMNS.some((c) => c.id === over.id)
      ? (over.id as TaskColumnType)
      : tasks.find((t) => t.id === over.id)?.column;
    if (!overColumn) return;

    const overTask = tasks.find((t) => t.id === over.id);

    if (activeTask.column === overColumn && overTask && activeTask.id !== overTask.id) {
      const colTasks = tasksByColumn(overColumn);
      const oldIndex = colTasks.findIndex((t) => t.id === active.id);
      const newIndex = colTasks.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(colTasks, oldIndex, newIndex).map((t, i) => ({ ...t, position: i }));
      const others = tasks.filter((t) => t.column !== overColumn);
      persist([...others, ...reordered]);
      return;
    }

    if (activeTask.column !== overColumn) {
      const destTasks = tasksByColumn(overColumn);
      const updated = tasks.map((t) =>
        t.id === activeTask.id ? { ...t, column: overColumn, position: destTasks.length } : t
      );
      persist(updated);
    }
  };

  const handleAddTask = (column: TaskColumnType) => {
    setModalState({ task: { column } });
  };

  const handleSaveTask = (data: { title: string; description: string; dueDate: string }) => {
    if (!modalState) return;
    const editing = modalState.task;

    if (editing?.id) {
      const updated = tasks.map((t) =>
        t.id === editing.id
          ? { ...t, title: data.title, description: data.description || undefined, dueDate: data.dueDate || undefined }
          : t
      );
      persist(updated);
    } else {
      const column = (editing?.column as TaskColumnType) || "todo";
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
        column,
        position: tasksByColumn(column).length,
        createdAt: new Date().toISOString(),
      };
      persist([...tasks, newTask]);
    }
    setModalState(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!window.confirm("Delete this task?")) return;
    persist(tasks.filter((t) => t.id !== taskId));
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-slate-400">Loading tasks...</div>;
  }

  if (loadError) {
    return <div className="flex-1 flex items-center justify-center text-red-500 text-sm">{loadError}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-2 border-b border-slate-200 bg-slate-50">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <KanbanSquare size={16} className="text-teal-500" /> Task Board
        </span>
      </div>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-3 p-4 overflow-x-auto">
          {COLUMNS.map((col) => (
            <TaskColumnComponent
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasksByColumn(col.id)}
              onAddTask={() => handleAddTask(col.id)}
              onEditTask={(task) => setModalState({ task })}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} />}
        </DragOverlay>
      </DndContext>

      {modalState && (
        <TaskModal
          task={modalState.task}
          onSave={handleSaveTask}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}

export default TaskBoard;
