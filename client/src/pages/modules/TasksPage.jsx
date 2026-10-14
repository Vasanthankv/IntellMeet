import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Calendar, AlertCircle, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Edit/Create state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    status: 'todo'
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/tasks', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.success) {
          setTasks(data.tasks);
        }
      } catch (err) {
        toast.error('Failed to load tasks');
      }
    };
    fetchTasks();
  }, []);

  // Removed local storage sync

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const url = isCreating ? '${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/tasks' : `${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/tasks/${selectedTaskId}`;
      const method = isCreating ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        if (isCreating) {
          setTasks([data.task, ...tasks]);
          setSelectedTaskId(data.task.id || data.task._id);
          setIsCreating(false);
          toast.success('Task created');
        } else {
          setTasks(tasks.map(t => (t.id || t._id) === selectedTaskId ? data.task : t));
          toast.success('Task updated');
        }
      } else {
        toast.error(data.message || 'Error saving task');
      }
    } catch (err) {
      toast.error('Failed to save task');
    }
  };

  const toggleTaskStatus = async (id) => {
    const task = tasks.find(t => (t.id || t._id) === id);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    
    // Optimistic update
    setTasks(tasks.map(t => (t.id || t._id) === id ? { ...t, status: newStatus } : t));
    
    try {
      await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(newStatus === 'completed' ? 'Marked as completed' : 'Marked as to-do');
    } catch (err) {
      // Revert on fail
      setTasks(tasks.map(t => (t.id || t._id) === id ? { ...t, status: task.status } : t));
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/tasks/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setTasks(tasks.filter(t => (t.id || t._id) !== id));
        if (selectedTaskId === id) setSelectedTaskId(null);
        toast.success('Task deleted');
      } catch (err) {
        toast.error('Failed to delete task');
      }
    }
  };

  const openCreateForm = () => {
    setFormData({ title: '', description: '', priority: 'Medium', dueDate: '', status: 'todo' });
    setIsCreating(true);
    setSelectedTaskId(null);
  };

  const openTaskDetail = (task) => {
    setFormData({ 
      title: task.title, 
      description: task.description || '', 
      priority: task.priority || 'Medium', 
      dueDate: task.dueDate || '', 
      status: task.status 
    });
    setSelectedTaskId(task.id);
    setIsCreating(false);
  };

  const priorityColors = {
    High: 'text-red-600 bg-red-50 border-red-200',
    Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    Low: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  return (
    <div className="flex flex-col h-full bg-white max-w-7xl mx-auto w-full pb-10 shadow-sm border-x border-gray-100">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Select a task to view or edit its detailed information.</p>
        </div>
        <button 
          onClick={openCreateForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Task
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-140px)]">
        {/* Left Pane: Task List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/30 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No tasks found. Click "Create Task" to get started.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => openTaskDetail(task)}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-blue-50/50 ${selectedTaskId === task.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id); }}
                    className="mt-0.5 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityColors[task.priority] || priorityColors.Medium}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Pane: Task Detail / Edit View */}
        <div className="w-2/3 bg-white flex flex-col overflow-y-auto">
          {(isCreating || selectedTask) ? (
            <form onSubmit={handleSave} className="p-8 max-w-3xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900">{isCreating ? 'Create New Task' : 'Task Details'}</h2>
                {selectedTask && (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleTaskStatus(selectedTask.id)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 border transition-colors ${selectedTask.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                      {selectedTask.status === 'completed' ? <><CheckCircle2 className="w-4 h-4" /> Completed</> : <><Circle className="w-4 h-4" /> Mark Complete</>}
                    </button>
                    <button type="button" onClick={() => handleDelete(selectedTask.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Title</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Detailed Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-40 resize-y"
                    placeholder="Provide context, instructions, or notes to perform this task appropriately..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority Level</label>
                    <select 
                      value={formData.priority} 
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
                    <input 
                      type="date" 
                      value={formData.dueDate} 
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button type="submit" className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                    {isCreating ? 'Save Task' : 'Update Details'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <AlertCircle className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium">Select a task from the list</p>
              <p className="text-xs mt-1">Or click "Create Task" to add a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
