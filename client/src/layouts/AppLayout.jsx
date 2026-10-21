import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Menu, Search, Bell, X } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to IntellMeet!', desc: 'Your account is active. Start or schedule a meeting anytime.', time: 'Recently', read: true }
  ]);

  const hasUnread = notifications.some(n => !n.read);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const [expandedMenus, setExpandedMenus] = useState({
    account: true,
    admin: true,
    plans: true,
    userMgmt: true,
    accountMgmt: true,
    advanced: true,
    support: true
  });

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path.startsWith('/admin')) {
      if (path === '/admin' || path === '/admin/users') {
        const adminSubroutes = ['/admin/plans', '/admin/billing', '/admin/payments', '/admin/account', '/admin/groups', '/admin/roles', '/admin/reports', '/admin/apps', '/admin/advanced'];
        const isSub = adminSubroutes.some(sub => location.pathname.startsWith(sub));
        return !isSub && !location.search.includes('tab=');
      }
      if (path.includes('?')) {
        const [base, queryStr] = path.split('?');
        const searchParams = new URLSearchParams(queryStr);
        const currentParams = new URLSearchParams(location.search);
        let match = location.pathname === base;
        for (const [key, val] of searchParams.entries()) {
          if (currentParams.get(key) !== val) match = false;
        }
        return match;
      }
      const segment = path.replace('/admin/', '');
      return location.pathname === path || location.search.includes(`tab=${segment}`);
    }
    return location.pathname === path;
  };

  const renderNavLinks = (onItemClick) => (
    <div className="py-4 space-y-1">
      <Link 
        to="/dashboard" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/dashboard') 
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600' 
            : 'font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Home
      </Link>

      <div className="pt-4 pb-2 px-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Products</p>
      </div>
      
      <Link 
        to="/modules/ai" 
        onClick={onItemClick}
        className={`flex items-center justify-between px-6 py-2 text-sm transition-colors ${
          isActive('/modules/ai')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        AI <span className="text-[10px] text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full font-semibold">New</span>
      </Link>
      <Link 
        to="/meetings" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/meetings')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Meetings
      </Link>
      <Link 
        to="/modules/recordings" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/modules/recordings')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Recordings
      </Link>
      <Link 
        to="/modules/summaries" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/modules/summaries')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Summaries
      </Link>
      <Link 
        to="/modules/hub" 
        onClick={onItemClick}
        className={`flex items-center justify-between px-6 py-2 text-sm transition-colors ${
          isActive('/modules/hub')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Hub <span className="text-[10px] text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full font-semibold">New</span>
      </Link>
      <Link 
        to="/modules/whiteboards" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/modules/whiteboards')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Whiteboards
      </Link>
      <Link 
        to="/modules/notes" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/modules/notes')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Notes
      </Link>
      <Link 
        to="/modules/clips" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/modules/clips')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Clips
      </Link>
      <Link 
        to="/modules/canvas" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/modules/canvas')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Canvas
      </Link>
      <Link 
        to="/modules/paper" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/modules/paper')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Paper
      </Link>
      <Link 
        to="/modules/sheets" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/modules/sheets')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Sheets
      </Link>
      <Link 
        to="/modules/slides" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/modules/slides')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Slides
      </Link>
      <Link 
        to="/tasks" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/tasks')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Tasks
      </Link>
      <Link 
        to="/meetings/schedule" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/meetings/schedule')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Scheduler
      </Link>
      <Link 
        to="/info/products" 
        onClick={onItemClick}
        className={`flex items-center px-6 py-2 text-sm transition-colors ${
          isActive('/info/products')
            ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        Discover More Products
      </Link>

      {/* My Account */}
      <div 
        onClick={() => toggleMenu('account')} 
        className="pt-6 pb-2 px-6 flex items-center justify-between cursor-pointer group"
      >
        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">My Account</p>
        <svg className={`w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-transform ${expandedMenus.account ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      
      {expandedMenus.account && (
        <div className="space-y-1 pb-2">
          <Link 
            to="/profile" 
            onClick={onItemClick}
            className={`flex items-center px-10 py-2 text-sm transition-colors ${
              isActive('/profile')
                ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            }`}
          >
            Profile
          </Link>
          <Link 
            to="/settings" 
            onClick={onItemClick}
            className={`flex items-center px-10 py-2 text-sm transition-colors ${
              isActive('/settings') && !location.search.includes('tab=integrations')
                ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            }`}
          >
            Settings
          </Link>
          <Link 
            to="/settings?tab=integrations" 
            onClick={onItemClick}
            className={`flex items-center px-10 py-2 text-sm transition-colors ${
              location.search.includes('tab=integrations')
                ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            }`}
          >
            Integrations & Apps (39)
          </Link>
          <Link 
            to="/settings/devices" 
            onClick={onItemClick}
            className={`flex items-center px-10 py-2 text-sm transition-colors ${
              isActive('/settings/devices')
                ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            }`}
          >
            Personal Devices
          </Link>
          <Link 
            to="/settings/contacts" 
            onClick={onItemClick}
            className={`flex items-center px-10 py-2 text-sm transition-colors ${
              isActive('/settings/contacts')
                ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            }`}
          >
            Personal Contacts
          </Link>
          <Link 
            to="/settings/privacy" 
            onClick={onItemClick}
            className={`flex items-center px-10 py-2 text-sm transition-colors ${
              isActive('/settings/privacy')
                ? 'font-semibold text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600'
            }`}
          >
            Data & Privacy
          </Link>
        </div>
      )}

      {/* Admin */}
      <div className="pt-2">
        <div 
          onClick={() => toggleMenu('admin')} 
          className="py-2 px-6 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className={`w-3 h-3 text-gray-500 transition-transform ${expandedMenus.admin ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            <p className="text-sm font-semibold text-gray-800">Admin</p>
          </div>
        </div>
        
        {expandedMenus.admin && (
          <div className="space-y-1 pb-2">
            {/* Plans and Billing */}
            <div onClick={() => toggleMenu('plans')} className="py-1.5 pl-10 pr-6 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <svg className={`w-3 h-3 text-gray-500 transition-transform ${expandedMenus.plans ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                <p className="text-[13px] text-gray-700 font-medium">Plans and Billing</p>
              </div>
            </div>
            {expandedMenus.plans && (
              <div className="space-y-0.5 pb-1">
                <Link to="/admin/plans" onClick={onItemClick} className={`block py-1.5 pl-16 pr-6 text-[13px] transition-colors ${isActive('/admin/plans') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>Plan Management</Link>
                <Link to="/admin/billing" onClick={onItemClick} className={`block py-1.5 pl-16 pr-6 text-[13px] transition-colors ${isActive('/admin/billing') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>Billing Management</Link>
                <Link to="/admin/payments" onClick={onItemClick} className={`block py-1.5 pl-16 pr-6 text-[13px] transition-colors ${isActive('/admin/payments') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>Payment History</Link>
              </div>
            )}

            {/* User Management */}
            <div onClick={() => toggleMenu('userMgmt')} className="py-1.5 pl-10 pr-6 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <svg className={`w-3 h-3 text-gray-500 transition-transform ${expandedMenus.userMgmt ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                <p className="text-[13px] text-gray-700 font-medium">User Management (Admin)</p>
              </div>
            </div>
            {expandedMenus.userMgmt && (
              <div className="space-y-0.5 pb-1">
                <Link to="/admin/users" onClick={onItemClick} className={`block py-1.5 pl-16 pr-6 text-[13px] transition-colors ${isActive('/admin/users') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>Users</Link>
                <Link to="/admin/groups" onClick={onItemClick} className={`block py-1.5 pl-16 pr-6 text-[13px] transition-colors ${isActive('/admin/groups') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>Groups</Link>
                <Link to="/admin/roles" onClick={onItemClick} className={`block py-1.5 pl-16 pr-6 text-[13px] transition-colors ${isActive('/admin/roles') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>Roles & Permissions</Link>
              </div>
            )}

            {/* Account Management */}
            <div onClick={() => toggleMenu('accountMgmt')} className="py-1.5 pl-10 pr-6 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <svg className={`w-3 h-3 text-gray-500 transition-transform ${expandedMenus.accountMgmt ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                <p className="text-[13px] text-gray-700 font-medium">Account Management</p>
              </div>
            </div>
            {expandedMenus.accountMgmt && (
              <div className="space-y-0.5 pb-1">
                <Link to="/admin/account" onClick={onItemClick} className={`block py-1.5 pl-16 pr-6 text-[13px] transition-colors ${isActive('/admin/account') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>Account Profile & Licenses</Link>
              </div>
            )}

            {/* Reports & Analytics */}
            <Link to="/admin/reports" onClick={onItemClick} className={`py-1.5 pl-10 pr-6 flex items-center gap-2 cursor-pointer transition-colors ${isActive('/admin/reports') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}>
              <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              <p className="text-[13px] font-medium">Reports & Analytics</p>
            </Link>

            {/* App Management */}
            <Link to="/admin/apps" onClick={onItemClick} className={`py-1.5 pl-10 pr-6 flex items-center gap-2 cursor-pointer transition-colors ${isActive('/admin/apps') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}>
              <svg className="w-3 h-3 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              <p className="text-[13px] font-medium">App Management (39)</p>
            </Link>

            {/* Advanced Administration */}
            <div onClick={() => toggleMenu('advanced')} className="py-1.5 pl-10 pr-6 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <svg className={`w-3 h-3 text-gray-500 transition-transform ${expandedMenus.advanced ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                <p className="text-[13px] text-gray-700 font-medium">Advanced Administration</p>
              </div>
            </div>
            {expandedMenus.advanced && (
              <div className="space-y-0.5 pb-1">
                <Link to="/admin/advanced?sub=sso" onClick={onItemClick} className={`block py-1.5 pl-16 pr-6 text-[13px] transition-colors ${isActive('/admin/advanced?sub=sso') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>Single Sign-On (SSO)</Link>
                <Link to="/admin/advanced?sub=branding" onClick={onItemClick} className={`block py-1.5 pl-16 pr-6 text-[13px] transition-colors ${isActive('/admin/advanced?sub=branding') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>Branding & Custom Domains</Link>
                <Link to="/admin/advanced?sub=audit" onClick={onItemClick} className={`block py-1.5 pl-16 pr-6 text-[13px] transition-colors ${isActive('/admin/advanced?sub=audit') ? 'text-blue-600 bg-blue-50 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}>Security & Audit Logs</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Support */}
      <div className="pb-4">
        <div 
          onClick={() => toggleMenu('support')} 
          className="py-2 px-6 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className={`w-3 h-3 text-gray-500 transition-transform ${expandedMenus.support ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            <p className="text-sm font-semibold text-gray-800">Support</p>
          </div>
        </div>
        
        {expandedMenus.support && (
          <div className="space-y-1 pb-2">
            <Link to="/support" onClick={onItemClick} className="flex items-center justify-between py-1.5 pl-10 pr-6 text-[13px] font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors">
              <span>IntellMeet Learning Center</span>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </Link>
            <Link to="/support" onClick={onItemClick} className="flex items-center justify-between py-1.5 pl-10 pr-6 text-[13px] font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors">
              <span>Video Tutorials</span>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </Link>
            <Link to="/support" onClick={onItemClick} className="block py-1.5 pl-10 pr-6 text-[13px] font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors">
              Knowledge Base
            </Link>
          </div>
        )}
      </div>
      
      {/* Upgrade banner */}
      <div className="pt-2 px-6 mb-4">
        <Link 
          to="/info/pricing" 
          onClick={onItemClick}
          className="flex items-center justify-center w-full gap-2 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors shadow-sm"
        >
          <span className="text-blue-600">★</span> Upgrade to Pro
        </Link>
      </div>
    </div>
  );

  const renderUserProfile = (onItemClick) => (
    <div>
      <Link 
        to="/profile" 
        onClick={onItemClick}
        className="flex items-center gap-3 mb-4 p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors group"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user?.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email || 'View Profile'}</p>
        </div>
      </Link>
      <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );

  return (
    <div className="h-screen w-full bg-gray-50 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col h-full shrink-0 select-none">
        {/* IntellMeet Pinned Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0 bg-white z-10">
          <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center text-white font-bold">I</div>
            IntellMeet
          </Link>
        </div>

        {/* Modules Navigation - Independent Seamless Scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {renderNavLinks()}
        </div>

        {/* Pinned Bottom User & Logout Profile */}
        <div className="p-4 border-t border-gray-200 shrink-0 bg-white z-10">
          {renderUserProfile()}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 h-full">
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 shrink-0 bg-white">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-primary-600 font-bold text-xl hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center text-white font-bold">I</div>
                IntellMeet
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              {renderNavLinks(() => setMobileMenuOpen(false))}
            </div>

            <div className="p-4 border-t border-gray-200 shrink-0 bg-white">
              {renderUserProfile(() => setMobileMenuOpen(false))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center md:hidden">
            <button 
              type="button" 
              onClick={() => setMobileMenuOpen(true)}
              className="text-gray-500 hover:text-gray-900 focus:outline-none p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs relative group/search">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="h-5 w-5 text-gray-400 group-focus-within/search:text-blue-500 transition-colors" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out relative z-10" 
                placeholder="Search..." 
              />
              
              {/* Search Results Dropdown (appears on focus) */}
              <div className="absolute top-0 left-0 right-0 pt-12 pb-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-0 opacity-0 invisible group-focus-within/search:opacity-100 group-focus-within/search:visible transition-all duration-200 origin-top">
                {searchQuery.toLowerCase().includes('support') ? (
                  <div className="px-4 py-2">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Support Results</p>
                    <div className="grid grid-cols-1 gap-2">
                      <Link to="/support" onClick={() => setSearchQuery('')} className="flex flex-col p-3 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors">
                        <span className="text-sm font-bold text-blue-900">Support Center</span>
                        <span className="text-xs text-blue-700">Go to the main support hub</span>
                      </Link>
                      <Link to="/support/chat" onClick={() => setSearchQuery('')} className="flex flex-col p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors">
                        <span className="text-sm font-semibold text-gray-900">Chat with Support</span>
                        <span className="text-xs text-gray-500">Talk to our AI assistant or a live agent</span>
                      </Link>
                    </div>
                  </div>
                ) : searchQuery.length > 0 ? (
                  <div className="px-4 py-2 text-center py-6">
                    <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Search for "{searchQuery}" across your workspace...</p>
                    <button className="mt-3 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100">See all results</button>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Workspace</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 px-2 py-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors text-sm text-gray-700">
                          <Search className="w-4 h-4 text-gray-400" />
                          <span>Search meetings, recordings, or users</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-2 mt-1 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Links</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Link to="/meetings/schedule" className="flex flex-col p-3 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 transition-colors">
                          <span className="text-xs font-semibold text-gray-900">Schedule Meeting</span>
                          <span className="text-[10px] text-gray-500">Create a new invite</span>
                        </Link>
                        <Link to="/modules/summaries" className="flex flex-col p-3 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 transition-colors">
                          <span className="text-xs font-semibold text-gray-900">AI Summaries</span>
                          <span className="text-[10px] text-gray-500">View past transcripts</span>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="ml-4 flex items-center md:ml-6 gap-3">
            
            {/* Notifications Dropdown */}
            <div className="relative group">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-900 focus:outline-none focus:bg-gray-100 relative transition-colors">
                <Bell className="h-5 w-5" />
                {hasUnread && <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>}
              </button>
              
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right transform scale-95 group-hover:scale-100">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  {hasUnread && (
                    <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline font-medium">Mark all as read</button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => markAsRead(notif.id)}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 cursor-pointer flex gap-3 ${notif.read ? 'opacity-60' : ''}`}
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.read ? 'bg-transparent border border-gray-300' : 'bg-blue-600'}`}></div>
                      <div>
                        <p className={`text-sm font-medium ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{notif.desc}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="px-4 py-2 border-t border-gray-100 text-center">
                  <Link to="/notifications" className="text-xs text-blue-600 hover:underline font-medium inline-block w-full">View all notifications</Link>
                </div>
              </div>
            </div>
            
            {/* User Profile Dropdown */}
            <div className="relative group">
              <button className="w-10 h-10 rounded-xl bg-purple-700 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-transparent group-hover:ring-purple-200 transition-all">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </button>
              
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-gray-200 py-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right transform scale-95 group-hover:scale-100">
                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-700 text-white font-bold flex items-center justify-center text-lg">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                    </div>
                  </div>
                </div>
                
                <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                  <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Profile
                </Link>
                <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                  <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Settings
                </Link>
                <Link to="/admin" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                  <svg className="w-4 h-4 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  Admin Center
                </Link>
                <Link to="/info/pricing" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                  <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                  Plans and billing
                </Link>
                <Link to="/support" className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Help
                  </div>
                  <span className="text-gray-400">&gt;</span>
                </Link>

                <div className="border-t border-gray-100 my-2"></div>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Add account</button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Sign out</button>

                <div className="mt-3 px-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Get more from IntellMeet</h4>
                    <p className="text-xs text-gray-600 mb-3 leading-snug">Upgrade to IntellMeet Pro for unlimited meetings and more.</p>
                    <Link to="/info/pricing" className="inline-block bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-blue-700">Upgrade now</Link>
                  </div>
                  <div className="text-center mt-3">
                    <Link to="/download" className="text-xs font-semibold text-blue-600 hover:underline">Download the IntellMeet app</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-6 lg:p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
