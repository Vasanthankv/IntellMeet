import React from 'react';
import { CheckCircle2, Clock, ChevronRight, CheckSquare, Plus } from 'lucide-react';
import { cn } from '../../utils';

export default function PendingTasksWidget({ tasks = [], onToggleTask, onOpenTaskModal }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary-600" />
          Pending Tasks ({tasks.filter(t => !t.completed).length})
        </h3>
        <button
          onClick={onOpenTaskModal}
          className="text-xs font-semibold px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
        {tasks.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-600">No pending tasks</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Keep track of your meeting follow-ups here.</p>
            <button
              onClick={onOpenTaskModal}
              className="mt-3 text-xs font-semibold text-primary-600 hover:underline"
            >
              + Create your first task
            </button>
          </div>
        ) : (
          tasks.map((task) => {
            const taskId = task._id || task.id;
            return (
              <div
                key={taskId}
                className={cn(
                  "flex items-start p-3 rounded-xl transition-all border",
                  task.completed
                    ? "bg-gray-50 border-gray-100 opacity-60"
                    : "bg-white border-gray-200 hover:border-primary-200 hover:shadow-sm"
                )}
              >
                <button
                  onClick={() => onToggleTask && onToggleTask(taskId)}
                  className={cn(
                    "flex-shrink-0 mt-0.5 transition-colors",
                    task.completed ? "text-emerald-500" : "text-gray-300 hover:text-primary-600"
                  )}
                  title={task.completed ? "Mark incomplete" : "Mark complete"}
                >
                  <CheckCircle2 className="w-5 h-5 fill-current text-white stroke-2" />
                </button>
                <div className="ml-3 flex-1 min-w-0">
                  <h4 className={cn("text-sm font-medium text-gray-900 line-clamp-1", task.completed && "line-through text-gray-400")}>
                    {task.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" /> {task.dueDate || task.due || 'Today'}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        task.priority === 'High' ? "bg-red-100 text-red-700" :
                        task.priority === 'Medium' ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-700"
                      )}
                    >
                      {task.priority || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
