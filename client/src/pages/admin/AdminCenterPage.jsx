import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  Users, Shield, Award, Building, FileText, Plus, Search, 
  MoreHorizontal, Trash2, Edit3, CheckCircle2, AlertCircle, 
  Lock, UserCheck, Key, RefreshCw, BarChart2, Globe
} from 'lucide-react';
import AnalyticsReportsView from './AnalyticsReportsView';
import AdminIntegrationsView from './AdminIntegrationsView';

export default function AdminCenterPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'User',
    license: 'Licensed',
    department: 'Engineering',
    jobTitle: '',
    pronouns: 'they/them'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to fetch organization users');
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    fetchUsers();
    const query = new URLSearchParams(location.search);
    const tabParam = query.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (location.pathname.includes('/reports') || location.pathname.includes('/analytics')) {
      setActiveTab('reports');
    }
  }, [location]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User ${formData.name} added to organization!`);
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          role: 'User',
          license: 'Licensed',
          department: 'Engineering',
          jobTitle: '',
          pronouns: 'they/them'
        });
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to add user');
      }
    } catch (err) {
      toast.error('Network error creating user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/users/${editingUser._id || editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          role: editingUser.role,
          license: editingUser.license,
          department: editingUser.department,
          jobTitle: editingUser.jobTitle,
          name: editingUser.name,
          pronouns: editingUser.pronouns
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User updated successfully');
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to update user');
      }
    } catch (err) {
      toast.error('Error updating user');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from this organization account?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User removed from organization');
        setUsers(users.filter(u => (u._id || u.id) !== id));
      } else {
        toast.error(data.message || 'Failed to remove user');
      }
    } catch (err) {
      toast.error('Error removing user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamically compute groups from real users' departments
  const departmentMap = {};
  users.forEach(u => {
    const dept = u.department || 'General';
    if (!departmentMap[dept]) {
      departmentMap[dept] = { name: dept, members: [], lead: null };
    }
    departmentMap[dept].members.push(u);
    if (!departmentMap[dept].lead || u.role === 'Administrator' || u.role === 'Account Owner') {
      departmentMap[dept].lead = u.name;
    }
  });
  const dynamicGroups = Object.values(departmentMap);

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'groups', label: 'Groups', icon: Building, count: dynamicGroups.length },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'account', label: 'Account Profile & Licenses', icon: Award },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart2 },
    { id: 'apps', label: 'App Management (39)', icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      
      {/* Top Header Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              <span>IntellMeet</span>
              <span>/</span>
              <span className="text-blue-600">Admin Center</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-blue-600" />
              Account Administration
            </h1>
            <p className="text-xs text-gray-500 mt-1">Manage users, license allocations, enterprise roles, and security policies</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Users
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 flex gap-6 overflow-x-auto border-t border-gray-100">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 border-b-2 text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* TAB 1: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Users</span>
                <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
                <span className="text-[11px] text-emerald-600 font-medium">100% active</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Licensed Users</span>
                <p className="text-2xl font-bold text-blue-600 mt-1">{users.filter(u => u.license === 'Licensed').length}</p>
                <span className="text-[11px] text-gray-500 font-medium">Unlimited meeting durations</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Administrators</span>
                <p className="text-2xl font-bold text-purple-600 mt-1">{users.filter(u => u.role === 'Administrator' || u.role === 'Account Owner').length}</p>
                <span className="text-[11px] text-gray-500 font-medium">Privileged management access</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Basic Users</span>
                <p className="text-2xl font-bold text-gray-600 mt-1">{users.filter(u => u.license === 'Basic').length}</p>
                <span className="text-[11px] text-gray-400 font-medium">Standard 40-min limit</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search by name, email, or department..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="text-xs text-gray-500">
                Showing <span className="font-bold text-gray-900">{filteredUsers.length}</span> members
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase border-b border-gray-200">
                    <tr>
                      <th className="py-3.5 px-6">User</th>
                      <th className="py-3.5 px-6">Department</th>
                      <th className="py-3.5 px-6">Account Role</th>
                      <th className="py-3.5 px-6">License</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center">
                          <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-700">No users found</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {searchQuery ? 'No members match your search criteria.' : 'No users have registered or been added to this organization yet.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u._id || u.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-xl object-cover" />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-purple-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                                  {u.name ? u.name.slice(0, 2).toUpperCase() : 'U'}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                  {u.name}
                                  {u.pronouns && (
                                    <span className="text-[10px] text-gray-400 font-normal">({u.pronouns})</span>
                                  )}
                                </div>
                                <div className="text-gray-500 text-[11px]">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-700 font-medium">
                            <div>{u.department || 'General'}</div>
                            <div className="text-[10px] text-gray-400">{u.jobTitle || 'Member'}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.role === 'Account Owner' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              u.role === 'Administrator' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              <Shield className="w-3 h-3" />
                              {u.role || 'User'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.license === 'Licensed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Award className="w-3 h-3" />
                              {u.license || 'Licensed'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 hover:bg-gray-100 text-blue-600 rounded-lg transition-colors"
                                title="Edit User"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u._id || u.id, u.name)}
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                title="Remove User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GROUPS */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Organizational Groups</h3>
                <p className="text-xs text-gray-500">Departments dynamically formed by registered members.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors"
              >
                + Add User to Group
              </button>
            </div>

            {dynamicGroups.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
                <Building className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-700">No organizational groups yet</p>
                <p className="text-xs text-gray-400 mt-1">Groups and departments will automatically populate as real users join and specify their department.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dynamicGroups.map(grp => (
                  <div key={grp.name} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{grp.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Active department group</p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {grp.members.length} {grp.members.length === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <span>Lead: <strong>{grp.lead || 'Not assigned'}</strong></span>
                      <span className="text-gray-400 text-[11px] truncate max-w-[200px]">
                        {grp.members.map(m => m.name).slice(0, 3).join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ROLES & PERMISSIONS */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Enterprise Roles & Permissions</h3>
              <p className="text-xs text-gray-500">Separation between Account-level administration and Meeting-level host controls.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 font-bold uppercase text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-4 px-6">Capability</th>
                    <th className="py-4 px-6 text-center text-purple-700">Account Owner</th>
                    <th className="py-4 px-6 text-center text-blue-700">Administrator</th>
                    <th className="py-4 px-6 text-center text-gray-700">Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">Account Profile & Billing Management</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Full Access</td>
                    <td className="py-3.5 px-6 text-center text-gray-400">View Only</td>
                    <td className="py-3.5 px-6 text-center text-gray-300">No Access</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">Add / Edit / Remove Users & Roles</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-gray-300">No</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">Assign Licenses & Manage Plans</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-gray-300">No</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">Lock Global Meeting Settings</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-gray-300">No</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">Host Meetings & Assign Co-hosts</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNT PROFILE & LICENSES */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Organization Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block mb-1">Account Name</span>
                  <span className="font-bold text-gray-900 text-sm">IntellMeet Enterprise Workspace</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Account Owner</span>
                  <span className="font-bold text-purple-700 text-sm">{user?.name || 'Organization Admin'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Account Number</span>
                  <span className="font-mono text-gray-800 text-sm">INTL-8942-2026</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Assigned Domain</span>
                  <span className="font-bold text-blue-600 text-sm">intellmeet.io</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">License Subscriptions</h3>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">Active</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-500">Meetings Pro Seats</span>
                  <p className="text-xl font-bold text-gray-900 mt-1">{users.filter(u => u.license === 'Licensed').length} / {Math.max(25, users.length)} Used</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-500">Gemini AI Transcripts</span>
                  <p className="text-xl font-bold text-purple-600 mt-1">Unlimited</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-500">Cloud Storage</span>
                  <p className="text-xl font-bold text-blue-600 mt-1">1.2 TB / 5 TB</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS & ANALYTICS (ZOOM PART 34 PARITY) */}
        {activeTab === 'reports' && (
          <AnalyticsReportsView />
        )}

        {/* TAB 6: APP MANAGEMENT & INTEGRATIONS (ZOOM PART 39 PARITY) */}
        {activeTab === 'apps' && (
          <AdminIntegrationsView />
        )}

      </div>

      {/* MODAL: ADD USER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">Add New User to Organization</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Full Name"
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Pronouns</label>
                  <input 
                    type="text" 
                    value={formData.pronouns} 
                    onChange={e => setFormData({ ...formData, pronouns: e.target.value })}
                    placeholder="e.g. they/them"
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Sign-In Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex.m@intellmeet.com"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Department</label>
                  <input 
                    type="text" 
                    value={formData.department} 
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Job Title</label>
                  <input 
                    type="text" 
                    value={formData.jobTitle} 
                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="e.g. Product Specialist"
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Enterprise Role</label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none bg-white font-medium"
                  >
                    <option value="User">User (Standard)</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Account Owner">Account Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">License Assignment</label>
                  <select 
                    value={formData.license} 
                    onChange={e => setFormData({ ...formData, license: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none bg-white font-medium"
                  >
                    <option value="Licensed">Licensed (Full Pro)</option>
                    <option value="Basic">Basic (Standard 40 min)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-base">Edit User: {editingUser.name}</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editingUser.name || ''} 
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Account Role</label>
                <select 
                  value={editingUser.role || 'User'} 
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none bg-white font-medium"
                >
                  <option value="User">User</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Account Owner">Account Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">License Assignment</label>
                <select 
                  value={editingUser.license || 'Licensed'} 
                  onChange={e => setEditingUser({ ...editingUser, license: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none bg-white font-medium"
                >
                  <option value="Licensed">Licensed (Full Pro)</option>
                  <option value="Basic">Basic (Standard)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Department</label>
                <input 
                  type="text" 
                  value={editingUser.department || ''} 
                  onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none font-medium"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
