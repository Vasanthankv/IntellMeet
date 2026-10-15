import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/apiConfig';
import { 
  Users, Shield, Award, Building, FileText, Plus, Search, 
  Trash2, Edit3, CheckCircle2, AlertCircle, 
  Lock, Key, RefreshCw, BarChart2, Globe,
  CreditCard, Receipt, History, Sliders, Download,
  Check, Copy, DollarSign, Calendar, Sparkles, HardDrive,
  ExternalLink, ArrowUpRight
} from 'lucide-react';
import AnalyticsReportsView from './AnalyticsReportsView';
import AdminIntegrationsView from './AdminIntegrationsView';

export default function AdminCenterPage() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showBillingModal, setShowBillingModal] = useState(false);

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

  // Billing & Plan state
  const [billingInfo, setBillingInfo] = useState({
    cardNumber: '•••• •••• •••• 4242',
    cardExpiry: '12/28',
    cardBrand: 'Visa',
    cardHolder: 'Enterprise Billing Admin',
    companyName: 'IntellMeet Technologies Inc.',
    address: '100 Innovation Way, Suite 400',
    city: 'San Francisco, CA 94105',
    taxId: 'US-94-3829102',
    billingEmail: 'billing@intellmeet.io',
    autoRenew: true
  });

  const [billingForm, setBillingForm] = useState({ ...billingInfo });

  // Advanced section sub-tab state
  const [advancedSubTab, setAdvancedSubTab] = useState('sso');
  const [ssoConfig, setSsoConfig] = useState({
    provider: 'Okta (SAML 2.0)',
    issuer: 'https://auth.company.com/oauth2/default',
    signInUrl: 'https://auth.company.com/app/intellmeet/sso/saml',
    signOutUrl: 'https://auth.company.com/app/intellmeet/sso/logout',
    certificate: '-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAL...IntellMeetEnterpriseCert2026...\n-----END CERTIFICATE-----',
    enforceSso: false
  });

  const [brandingConfig, setBrandingConfig] = useState({
    vanityDomain: 'company.intellmeet.io',
    accentColor: '#2563EB',
    customLogoUrl: '',
    emailHeader: 'Welcome to your enterprise collaboration portal'
  });

  const [securityPolicies, setSecurityPolicies] = useState({
    minPasswordLength: '12',
    requireMfa: true,
    sessionTimeout: '30m',
    requireWaitingRoom: true,
    watermarkShares: true,
    recordingRetention: '90d'
  });

  // Mock payment invoice history
  const [invoices] = useState([
    { id: 'INV-2026-10-01', date: 'Oct 01, 2026', amount: '$499.75', seats: '25 Seats (Business Pro)', status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2026-09-01', date: 'Sep 01, 2026', amount: '$499.75', seats: '25 Seats (Business Pro)', status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2026-08-01', date: 'Aug 01, 2026', amount: '$499.75', seats: '25 Seats (Business Pro)', status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2026-07-01', date: 'Jul 01, 2026', amount: '$499.75', seats: '25 Seats (Business Pro)', status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2026-06-01', date: 'Jun 01, 2026', amount: '$499.75', seats: '25 Seats (Business Pro)', status: 'Paid', method: 'Visa •••• 4242' }
  ]);

  // Audit logs data
  const [auditLogs] = useState([
    { id: 1, event: 'User.RoleUpdated', actor: 'Admin Console', target: 'Vasunth (Account Owner)', ip: '157.48.241.10', time: '10 minutes ago', status: 'Success' },
    { id: 2, event: 'Meeting.SecurityLocked', actor: 'Host (Vasunth)', target: 'Room #6792759134', ip: '157.48.241.10', time: '42 minutes ago', status: 'Success' },
    { id: 3, event: 'License.Allocated', actor: 'System Auto-Assign', target: '25 Seats Pro', ip: '10.0.4.12', time: '2 hours ago', status: 'Success' },
    { id: 4, event: 'Security.MfaPolicyChecked', actor: 'Policy Engine', target: 'All Users Enforced', ip: 'Internal', time: 'Yesterday', status: 'Success' },
    { id: 5, event: 'User.Created', actor: 'Admin Console', target: 'alex.m@intellmeet.com', ip: '157.48.241.10', time: '2 days ago', status: 'Success' },
    { id: 6, event: 'App.IntegrationAuthorized', actor: 'Vasunth', target: 'Google Calendar Sync', ip: '157.48.241.10', time: '3 days ago', status: 'Success' },
    { id: 7, event: 'Billing.InvoiceGenerated', actor: 'Stripe Gateway', target: 'INV-2026-10-01', ip: 'Stripe Webhook', time: 'Oct 01, 2026', status: 'Success' }
  ]);

  const [auditSearch, setAuditSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        toast.error(data.message || 'Failed to fetch organization users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to fetch organization users');
    } finally {
      setLoading(false);
    }
  };

  // Sync tab with URL pathname and search query params
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const query = new URLSearchParams(location.search);
    const tabParam = query.get('tab');
    const subParam = query.get('sub');

    if (subParam) {
      setAdvancedSubTab(subParam);
    }

    if (tabParam) {
      setActiveTab(tabParam);
    } else if (path.includes('/plans')) {
      setActiveTab('plans');
    } else if (path.includes('/billing')) {
      setActiveTab('billing');
    } else if (path.includes('/payments')) {
      setActiveTab('payments');
    } else if (path.includes('/reports') || path.includes('/analytics')) {
      setActiveTab('reports');
    } else if (path.includes('/apps') || path.includes('/integrations')) {
      setActiveTab('apps');
    } else if (path.includes('/account')) {
      setActiveTab('account');
    } else if (path.includes('/groups')) {
      setActiveTab('groups');
    } else if (path.includes('/roles')) {
      setActiveTab('roles');
    } else if (path.includes('/advanced')) {
      setActiveTab('advanced');
    } else if (path.includes('/users')) {
      setActiveTab('users');
    } else if (path === '/admin') {
      setActiveTab('users');
    }
  }, [location.pathname, location.search]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'users') navigate('/admin/users');
    else navigate(`/admin/${tabId}`);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users`, {
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
      const res = await fetch(`${API_BASE_URL}/users/${editingUser._id || editingUser.id}`, {
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
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
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

  const handleDownloadReceipt = (inv) => {
    const receiptContent = `=========================================
INTELLMEET ENTERPRISE INVOICE RECEIPT
=========================================
Invoice Number: ${inv.id}
Date: ${inv.date}
Status: ${inv.status} (Verified)
Plan: ${inv.seats}
Amount Paid: ${inv.amount}
Payment Method: ${inv.method}
Billed To: ${billingInfo.companyName}
Address: ${billingInfo.address}, ${billingInfo.city}
Tax ID: ${billingInfo.taxId}
=========================================
Thank you for using IntellMeet Video Platform!
`;
    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inv.id}-receipt.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded receipt for ${inv.id}`);
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
    { id: 'plans', label: 'Plan Management', icon: CreditCard },
    { id: 'billing', label: 'Billing Management', icon: Receipt },
    { id: 'payments', label: 'Payment History', icon: History },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart2 },
    { id: 'apps', label: 'App Management (39)', icon: Globe },
    { id: 'advanced', label: 'Advanced Administration', icon: Sliders }
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
              Enterprise Administration
            </h1>
            <p className="text-xs text-gray-500 mt-1">Manage users, license allocations, plans, billing, enterprise security, and integrations</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
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
                onClick={() => handleTabChange(tab.id)}
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
        
        {/* ========================================================================= */}
        {/* TAB 1: USERS */}
        {/* ========================================================================= */}
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
                    {loading && users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-gray-400">
                          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                          <p className="text-xs font-semibold">Loading organization users...</p>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
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

        {/* ========================================================================= */}
        {/* TAB 2: GROUPS */}
        {/* ========================================================================= */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Organizational Groups</h3>
                <p className="text-xs text-gray-500">Departments dynamically formed by registered enterprise members.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add User to Group
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

        {/* ========================================================================= */}
        {/* TAB 3: ROLES & PERMISSIONS */}
        {/* ========================================================================= */}
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
                    <th className="py-4 px-6">Capability Dimension</th>
                    <th className="py-4 px-6 text-center text-purple-700">Account Owner</th>
                    <th className="py-4 px-6 text-center text-blue-700">Administrator</th>
                    <th className="py-4 px-6 text-center text-gray-700">User</th>
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
                    <td className="py-3.5 px-6 font-semibold text-gray-900">Add / Edit / Remove Organization Users</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-gray-300">No</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">Assign Licenses & Manage Subscription Plans</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-gray-300">No</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">Lock Global Meeting Security Policies</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-gray-300">No</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">Single Sign-On (SSO) & SAML Configuration</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-emerald-600 font-bold">Yes</td>
                    <td className="py-3.5 px-6 text-center text-gray-300">No</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">View Audit Logs & System Telemetry</td>
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

        {/* ========================================================================= */}
        {/* TAB 4: ACCOUNT PROFILE & LICENSES */}
        {/* ========================================================================= */}
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
                  <span className="font-bold text-blue-600 text-sm">{brandingConfig.vanityDomain}</span>
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

            {/* Enterprise Security Policies */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Organization Security Policies</h3>
              <p className="text-xs text-gray-500">Enforce global security baseline across all organization meetings and participants.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">Minimum Password Length</p>
                    <p className="text-gray-500 text-[11px]">Enforce password complexity</p>
                  </div>
                  <select 
                    value={securityPolicies.minPasswordLength}
                    onChange={e => setSecurityPolicies({ ...securityPolicies, minPasswordLength: e.target.value })}
                    className="border border-gray-300 rounded-lg p-1.5 text-xs font-medium"
                  >
                    <option value="8">8 Characters</option>
                    <option value="12">12 Characters (Recommended)</option>
                    <option value="16">16 Characters</option>
                  </select>
                </div>

                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">Require Two-Factor Auth (2FA)</p>
                    <p className="text-gray-500 text-[11px]">Enforced for all account members</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={securityPolicies.requireMfa}
                    onChange={e => setSecurityPolicies({ ...securityPolicies, requireMfa: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>

                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">Require Waiting Room for Guests</p>
                    <p className="text-gray-500 text-[11px]">Default on for all scheduled calls</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={securityPolicies.requireWaitingRoom}
                    onChange={e => setSecurityPolicies({ ...securityPolicies, requireWaitingRoom: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>

                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">Screen Share Watermark</p>
                    <p className="text-gray-500 text-[11px]">Stamps viewer's email on shared video</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={securityPolicies.watermarkShares}
                    onChange={e => setSecurityPolicies({ ...securityPolicies, watermarkShares: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => toast.success('Enterprise security policies updated and synced!')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors"
                >
                  Save Security Policies
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PLANS & PLAN MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* Current Active Plan Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Subscription
                  </span>
                  <span className="text-xs text-blue-200 font-medium">Annual Plan • Renews Oct 2027</span>
                </div>
                <h2 className="text-2xl font-bold">IntellMeet Business Pro</h2>
                <p className="text-xs text-blue-200 mt-1">25 Dedicated Host Licenses with Gemini AI & Unlimited Cloud Recording</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleTabChange('billing')}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/20"
                >
                  Billing Details
                </button>
                <button 
                  onClick={() => toast.success('Your account is already on the top tier Business Pro plan!')}
                  className="bg-white text-blue-900 hover:bg-blue-50 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Upgrade Seats
                </button>
              </div>
            </div>

            {/* Plan Tiers Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Basic */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Basic Free</h4>
                  <div className="mt-2 text-2xl font-bold text-gray-900">$0 <span className="text-xs text-gray-400 font-normal">/mo</span></div>
                  <p className="text-xs text-gray-500 mt-1">Personal & casual meetings</p>
                  <ul className="mt-4 space-y-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Up to 100 participants</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 40-minute meeting limit</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 3 Whiteboards</li>
                  </ul>
                </div>
                <button disabled className="mt-6 w-full py-2 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed">
                  Included
                </button>
              </div>

              {/* Pro */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Pro</h4>
                  <div className="mt-2 text-2xl font-bold text-gray-900">$14.99 <span className="text-xs text-gray-400 font-normal">/mo/host</span></div>
                  <p className="text-xs text-gray-500 mt-1">Small teams & creators</p>
                  <ul className="mt-4 space-y-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Up to 100 participants</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 30-hour meeting duration</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> 5 GB Cloud Storage</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> AI Meeting Summaries</li>
                  </ul>
                </div>
                <button 
                  onClick={() => toast.success('Account is already on higher tier Business Pro')}
                  className="mt-6 w-full py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Downgrade to Pro
                </button>
              </div>

              {/* Business (Current) */}
              <div className="bg-white p-6 rounded-2xl border-2 border-blue-600 shadow-md flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                  Current Plan
                </div>
                <div>
                  <h4 className="font-bold text-blue-600 text-base">Business Pro</h4>
                  <div className="mt-2 text-2xl font-bold text-gray-900">$19.99 <span className="text-xs text-gray-400 font-normal">/mo/host</span></div>
                  <p className="text-xs text-gray-500 mt-1">Growth & enterprise companies</p>
                  <ul className="mt-4 space-y-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Up to 300 participants</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Unlimited Cloud Storage</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Single Sign-On (SSO)</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Custom Vanity URL Domain</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Full Gemini AI Suite</li>
                  </ul>
                </div>
                <button className="mt-6 w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-default">
                  Active (25 Seats)
                </button>
              </div>

              {/* Enterprise */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Enterprise</h4>
                  <div className="mt-2 text-2xl font-bold text-gray-900">Custom <span className="text-xs text-gray-400 font-normal">pricing</span></div>
                  <p className="text-xs text-gray-500 mt-1">Large multi-org deployment</p>
                  <ul className="mt-4 space-y-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Up to 1,000 participants</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Dedicated Customer Success</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> HIPAA / BAA Compliance</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Real-time Audit Webhooks</li>
                  </ul>
                </div>
                <button 
                  onClick={() => toast.success('An enterprise representative has been notified!')}
                  className="mt-6 w-full py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Contact Sales
                </button>
              </div>
            </div>

            {/* Host Add-ons */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900">Enterprise Add-ons</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-gray-900">Large Meeting 500</h5>
                    <p className="text-gray-500 mt-0.5">$50.00 / month</p>
                  </div>
                  <button 
                    onClick={() => toast.success('Large Meeting 500 added to plan subscription!')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-gray-900">Cloud Storage 3 TB</h5>
                    <p className="text-gray-500 mt-0.5">$40.00 / month</p>
                  </div>
                  <button 
                    onClick={() => toast.success('3 TB storage expansion applied to account!')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-gray-900">Toll-Free Dial-in Audio</h5>
                    <p className="text-gray-500 mt-0.5">$100.00 / month</p>
                  </div>
                  <button 
                    onClick={() => toast.success('Audio Toll-Free conferencing activated!')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: BILLING MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Payment Method Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    Payment Method
                  </h3>
                  <button 
                    onClick={() => setShowBillingModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                  >
                    Update
                  </button>
                </div>

                <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl shadow-md space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase tracking-widest">{billingInfo.cardBrand}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Default</span>
                  </div>
                  <p className="font-mono text-base tracking-widest">{billingInfo.cardNumber}</p>
                  <div className="flex justify-between text-xs text-gray-300">
                    <div>
                      <span className="block text-[9px] text-gray-400 uppercase">Cardholder</span>
                      <span>{billingInfo.cardHolder}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-400 uppercase">Expires</span>
                      <span>{billingInfo.cardExpiry}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-1 flex items-center justify-between">
                  <span>Auto-renew upcoming invoices:</span>
                  <span className="font-bold text-emerald-600">Enabled</span>
                </div>
              </div>

              {/* Billing Contact & Address */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-purple-600" />
                    Billing Contact & Address
                  </h3>
                  <button 
                    onClick={() => setShowBillingModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-2 text-xs text-gray-700">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Organization Name</span>
                    <span className="font-bold text-gray-900">{billingInfo.companyName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Billing Email</span>
                    <span className="font-bold text-blue-600">{billingInfo.billingEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Tax / VAT ID</span>
                    <span className="font-mono text-gray-900">{billingInfo.taxId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Physical Address</span>
                    <span>{billingInfo.address}, {billingInfo.city}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Next Invoice Preview */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-gray-900">Estimated Next Invoice</h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-gray-900 text-sm">Next Billing Date: November 01, 2026</span>
                  <p className="text-gray-500 mt-0.5">Includes 25 Host Licenses • IntellMeet Business Pro</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-900">$499.75</span>
                  <p className="text-[11px] text-gray-400">Taxes calculated automatically</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: PAYMENT HISTORY */}
        {/* ========================================================================= */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payment History & Invoices</h3>
                <p className="text-xs text-gray-500">Download enterprise receipts and tax statements for your account.</p>
              </div>
              <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-bold border border-blue-200">
                Annual Spend: $5,997.00
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 font-bold uppercase text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="py-3.5 px-6">Invoice ID</th>
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6">Description</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">Payment Method</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-gray-900">{inv.id}</td>
                        <td className="py-4 px-6 text-gray-600">{inv.date}</td>
                        <td className="py-4 px-6 text-gray-800 font-medium">{inv.seats}</td>
                        <td className="py-4 px-6 font-bold text-gray-900">{inv.amount}</td>
                        <td className="py-4 px-6 text-gray-600">{inv.method}</td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> {inv.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDownloadReceipt(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                            title="Download Receipt"
                          >
                            <Download className="w-3.5 h-3.5" /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: REPORTS & ANALYTICS (ZOOM PART 34 PARITY) */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <AnalyticsReportsView />
        )}

        {/* ========================================================================= */}
        {/* TAB 9: APP MANAGEMENT & INTEGRATIONS (ZOOM PART 39 PARITY) */}
        {/* ========================================================================= */}
        {activeTab === 'apps' && (
          <AdminIntegrationsView />
        )}

        {/* ========================================================================= */}
        {/* TAB 10: ADVANCED ADMINISTRATION */}
        {/* ========================================================================= */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Advanced Administration</h3>
                <p className="text-xs text-gray-500">Configure Single Sign-On (SSO), custom domain vanity URLs, and inspect audit logs.</p>
              </div>
            </div>

            {/* Sub-tabs header */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setAdvancedSubTab('sso')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  advancedSubTab === 'sso' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Single Sign-On (SSO)
              </button>
              <button
                onClick={() => setAdvancedSubTab('branding')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  advancedSubTab === 'branding' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Branding & Custom Domains
              </button>
              <button
                onClick={() => setAdvancedSubTab('audit')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  advancedSubTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Security & Audit Logs
              </button>
            </div>

            {/* SUB-VIEW 1: SSO */}
            {advancedSubTab === 'sso' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">SAML 2.0 Single Sign-On</h4>
                    <p className="text-xs text-gray-500">Enable Okta, Microsoft Azure AD, Google Workspace, or PingIdentity.</p>
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
                    SAML Active
                  </span>
                </div>

                <div className="space-y-3 text-xs pt-2">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Identity Provider</label>
                    <select 
                      value={ssoConfig.provider}
                      onChange={e => setSsoConfig({ ...ssoConfig, provider: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none bg-white font-medium"
                    >
                      <option>Okta (SAML 2.0)</option>
                      <option>Microsoft Entra ID (Azure AD)</option>
                      <option>Google Workspace SAML</option>
                      <option>PingFederate</option>
                      <option>OneLogin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Identity Provider Issuer URL</label>
                    <input 
                      type="text" 
                      value={ssoConfig.issuer}
                      onChange={e => setSsoConfig({ ...ssoConfig, issuer: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2.5 font-mono text-xs focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">SSO Sign-In URL</label>
                      <input 
                        type="text" 
                        value={ssoConfig.signInUrl}
                        onChange={e => setSsoConfig({ ...ssoConfig, signInUrl: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl p-2.5 font-mono text-xs focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">SSO Sign-Out URL</label>
                      <input 
                        type="text" 
                        value={ssoConfig.signOutUrl}
                        onChange={e => setSsoConfig({ ...ssoConfig, signOutUrl: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl p-2.5 font-mono text-xs focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">X.509 Identity Provider Certificate</label>
                    <textarea 
                      rows="3"
                      value={ssoConfig.certificate}
                      onChange={e => setSsoConfig({ ...ssoConfig, certificate: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2.5 font-mono text-xs focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={ssoConfig.enforceSso}
                        onChange={e => setSsoConfig({ ...ssoConfig, enforceSso: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="font-bold text-gray-800">Enforce SSO for all organization users</span>
                    </label>

                    <button 
                      onClick={() => toast.success('SSO configuration successfully saved!')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-colors"
                    >
                      Save SSO Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: BRANDING */}
            {advancedSubTab === 'branding' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-900 text-base">Branding & Custom Domains</h4>
                <p className="text-xs text-gray-500">Personalize meeting invitations, logos, and customize your enterprise vanity URL.</p>

                <div className="space-y-4 text-xs pt-2">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Custom Vanity URL Domain</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={brandingConfig.vanityDomain}
                        onChange={e => setBrandingConfig({ ...brandingConfig, vanityDomain: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl p-2.5 font-mono focus:border-blue-500 outline-none"
                      />
                      <button 
                        onClick={() => toast.success(`DNS for ${brandingConfig.vanityDomain} verified!`)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl whitespace-nowrap"
                      >
                        Verify DNS
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Brand Accent Color</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={brandingConfig.accentColor}
                          onChange={e => setBrandingConfig({ ...brandingConfig, accentColor: e.target.value })}
                          className="w-10 h-10 border border-gray-300 rounded-xl cursor-pointer"
                        />
                        <span className="font-mono text-gray-700 font-bold">{brandingConfig.accentColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Custom Meeting Logo URL</label>
                      <input 
                        type="text" 
                        placeholder="https://company.com/assets/logo.png"
                        value={brandingConfig.customLogoUrl}
                        onChange={e => setBrandingConfig({ ...brandingConfig, customLogoUrl: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Email Invitation Header</label>
                    <input 
                      type="text" 
                      value={brandingConfig.emailHeader}
                      onChange={e => setBrandingConfig({ ...brandingConfig, emailHeader: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button 
                      onClick={() => toast.success('Custom branding and vanity domain settings saved!')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-colors"
                    >
                      Save Branding
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: AUDIT LOGS */}
            {advancedSubTab === 'audit' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search audit events, actors, or targets..."
                      value={auditSearch}
                      onChange={e => setAuditSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <button 
                    onClick={() => {
                      const csv = "Event,Actor,Target,IP,Time,Status\n" + auditLogs.map(l => `"${l.event}","${l.actor}","${l.target}","${l.ip}","${l.time}","${l.status}"`).join("\n");
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `audit-logs-${Date.now()}.csv`;
                      a.click();
                      toast.success('Audit logs exported to CSV');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 font-bold uppercase text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="py-3.5 px-6">Event Type</th>
                        <th className="py-3.5 px-6">Actor</th>
                        <th className="py-3.5 px-6">Target</th>
                        <th className="py-3.5 px-6">IP Address</th>
                        <th className="py-3.5 px-6">Timestamp</th>
                        <th className="py-3.5 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {auditLogs
                        .filter(l => l.event.toLowerCase().includes(auditSearch.toLowerCase()) || l.actor.toLowerCase().includes(auditSearch.toLowerCase()) || l.target.toLowerCase().includes(auditSearch.toLowerCase()))
                        .map(log => (
                          <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-900">{log.event}</td>
                            <td className="py-3.5 px-6 text-gray-700">{log.actor}</td>
                            <td className="py-3.5 px-6 text-gray-600">{log.target}</td>
                            <td className="py-3.5 px-6 font-mono text-[11px] text-gray-500">{log.ip}</td>
                            <td className="py-3.5 px-6 text-gray-500">{log.time}</td>
                            <td className="py-3.5 px-6">
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD USER */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* MODAL: EDIT USER */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* MODAL: EDIT BILLING INFO */}
      {/* ========================================================================= */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-base">Update Payment & Billing Information</h3>
              <button onClick={() => setShowBillingModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
            </div>
            <form 
              onSubmit={e => {
                e.preventDefault();
                setBillingInfo({ ...billingForm });
                setShowBillingModal(false);
                toast.success('Billing & payment details updated successfully!');
              }} 
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Card Number</label>
                  <input 
                    type="text" 
                    required 
                    value={billingForm.cardNumber} 
                    onChange={e => setBillingForm({ ...billingForm, cardNumber: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-mono focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Expiry (MM/YY)</label>
                  <input 
                    type="text" 
                    required 
                    value={billingForm.cardExpiry} 
                    onChange={e => setBillingForm({ ...billingForm, cardExpiry: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-mono focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Name on Card</label>
                <input 
                  type="text" 
                  required 
                  value={billingForm.cardHolder} 
                  onChange={e => setBillingForm({ ...billingForm, cardHolder: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Organization Legal Name</label>
                  <input 
                    type="text" 
                    required 
                    value={billingForm.companyName} 
                    onChange={e => setBillingForm({ ...billingForm, companyName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Billing Email</label>
                  <input 
                    type="email" 
                    required 
                    value={billingForm.billingEmail} 
                    onChange={e => setBillingForm({ ...billingForm, billingEmail: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Billing Address</label>
                  <input 
                    type="text" 
                    required 
                    value={billingForm.address} 
                    onChange={e => setBillingForm({ ...billingForm, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">City, State & ZIP</label>
                  <input 
                    type="text" 
                    required 
                    value={billingForm.city} 
                    onChange={e => setBillingForm({ ...billingForm, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowBillingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20"
                >
                  Save Billing Information
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
