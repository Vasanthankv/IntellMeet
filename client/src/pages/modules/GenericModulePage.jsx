import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Folder, FileText, Trash2, Calendar, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GenericModulePage() {
  const { type } = useParams();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  const moduleName = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Module';
  const storageKey = `intellmeet_module_data_${type}`;
  
  const fetchItems = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/modules/${type}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(data.items);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to load items', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchItems();
  }, [type]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/modules/${type}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          title: newItemName,
          description: newItemDesc
        })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setItems([data.item, ...items]);
        toast.success(`${moduleName} created successfully!`);
        setIsModalOpen(false);
        setNewItemName('');
        setNewItemDesc('');
      } else {
        toast.error('Failed to create item.');
      }
    } catch (error) {
      toast.error('Failed to create item.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${moduleName}?`)) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/modules/${type}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setItems(items.filter(item => item._id !== id));
        toast.success(`${moduleName} deleted.`);
      } else {
        toast.error('Failed to delete item.');
      }
    } catch (error) {
      toast.error('Failed to delete item.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900">{moduleName}</h1>
          <p className="text-[14px] text-gray-500 mt-1">Manage your {type} and collaborate efficiently.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
            <Folder className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No {type} found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            You don't have any {type} yet. Create your first one to get started.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-6 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Create {moduleName}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {item.description || <span className="text-gray-300 italic">No description</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-500 gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => toast.success(`Opening ${item.title}...`)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 bg-white border border-gray-200 rounded-md shadow-sm"
                        title="Open"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1.5 bg-white border border-gray-200 rounded-md shadow-sm"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Create New {moduleName}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-medium">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    value={newItemName} 
                    onChange={e => setNewItemName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={`E.g., Q3 Planning ${moduleName}`}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                  <textarea 
                    value={newItemDesc} 
                    onChange={e => setNewItemDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none"
                    placeholder="Enter details..."
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!newItemName.trim()} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
