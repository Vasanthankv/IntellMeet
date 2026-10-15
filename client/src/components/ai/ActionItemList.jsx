import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, CheckCircle, User, Plus, 
  Trash2, Edit2, AlertCircle, Check, X, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ActionItemList({ 
  actionItems = [], 
  onToggleStatus = null,
  onAddActionItem = null,
  onDeleteActionItem = null,
  onEditActionItem = null
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) {
      toast.error('Task description is required');
      return;
    }
    if (onAddActionItem) {
      await onAddActionItem({
        task: newTask.trim(),
        assignedTo: newAssignee.trim() || 'Unassigned',
        dueDate: newDueDate.trim() || 'Next Sprint',
        priority: newPriority
      });
      setNewTask('');
      setNewAssignee('');
      setNewDueDate('');
      setShowAddForm(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Action Items & Tasks (25.8)</h3>
            <p className="text-xs text-gray-500">{actionItems.length} tasks extracted & tracked</p>
          </div>
        </div>

        {onAddActionItem && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action Item</span>
          </button>
        )}
      </div>

      {/* Add New Action Item Inline Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="p-4 bg-purple-50/50 border-b border-purple-100 space-y-3">
          <input
            type="text"
            placeholder="Action item task description..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="w-full text-xs sm:text-sm p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Assignee (e.g. Alex)"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="text-xs p-2 bg-white border border-gray-300 rounded-lg focus:outline-none"
            />
            <input
              type="text"
              placeholder="Due Date (e.g. Friday)"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="text-xs p-2 bg-white border border-gray-300 rounded-lg focus:outline-none"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="text-xs p-2 bg-white border border-gray-300 rounded-lg focus:outline-none"
            >
              <option value="Low">Priority: Low</option>
              <option value="Medium">Priority: Medium</option>
              <option value="High">Priority: High</option>
              <option value="Urgent">Priority: Urgent</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
            >
              Save Action Item
            </button>
          </div>
        </form>
      )}

      {/* Action Items List */}
      <div className="p-0">
        {actionItems.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs italic">
            No action items recorded for this meeting.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {actionItems.map((item) => {
              const isCompleted = item.status === 'Completed' || item.status === 'Done';
              const itemId = item.actionItemId || item.id;

              return (
                <li key={itemId} className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4 group">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => onToggleStatus && onToggleStatus(itemId, isCompleted ? 'Pending' : 'Completed')}
                      className="mt-0.5 shrink-0 transition-transform active:scale-90"
                      title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-purple-500 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {item.task}
                      </p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 font-semibold">
                          <User className="w-3 h-3 text-indigo-600" />
                          {item.assignedTo || item.assignee || 'Unassigned'}
                        </span>

                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3 text-gray-400" />
                          Due {item.dueDate || item.due || 'Next Sprint'}
                        </span>

                        {item.priority && (
                          <span className={`px-2 py-0.5 rounded-full border font-semibold text-[11px] ${getPriorityBadge(item.priority)}`}>
                            {item.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {onDeleteActionItem && (
                    <button
                      onClick={() => onDeleteActionItem(itemId)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                      title="Delete action item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
