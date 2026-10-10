import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, RefreshCw, CheckCircle2, XCircle, Search, 
  Layers, Lock, AlertTriangle, FileText, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminIntegrationsView() {
  const [apps, setApps] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('apps'); // 'apps' | 'audit'
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [appsRes, logsRes] = await Promise.all([
        fetch('http://localhost:5000/api/integrations/marketplace', { headers }),
        fetch('http://localhost:5000/api/integrations/admin/audit-logs', { headers })
      ]);

      const [appsData, logsData] = await Promise.all([appsRes.json(), logsRes.json()]);

      if (appsData.success) setApps(appsData.apps || []);
      if (logsData.success) setAuditLogs(logsData.logs || []);
    } catch (e) {
      toast.error('Failed to load admin integrations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleApprovalRequired = async (integrationId, currentVal) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/integrations/admin/apps/${integrationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ approvalRequired: !currentVal })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Updated policy for ${integrationId}`);
        fetchData();
      }
    } catch (e) {
      toast.error('Error updating app policy');
    }
  };

  const handleToggleAppStatus = async (integrationId, currentStatus) => {
    const nextStatus = currentStatus === 'DISABLED_BY_ADMIN' ? 'ACTIVE' : 'DISABLED_BY_ADMIN';
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/integrations/admin/apps/${integrationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Updated ${integrationId} status to ${nextStatus}`);
        fetchData();
      }
    } catch (e) {
      toast.error('Error updating app status');
    }
  };

  const filteredApps = apps.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Sub Tabs */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div className="flex gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('apps')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'apps' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Organization Apps & Policy ({apps.length})
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'audit' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Compliance & Audit Logs ({auditLogs.length})
          </button>
        </div>

        <button
          onClick={fetchData}
          className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* TAB 1: ORG APPS MANAGEMENT */}
      {activeSubTab === 'apps' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Control which workplace apps organization members are permitted to install and whether security pre-approval is required.
            </p>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {filteredApps.map(app => (
              <div key={app.integrationId} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-sm text-blue-600">
                    {app.provider?.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <span>{app.name}</span>
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-semibold uppercase">
                        {app.category.replace('_', ' ')}
                      </span>
                      {app.status === 'DISABLED_BY_ADMIN' && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">
                          Disabled by Admin
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {app.requestedPermissions?.length || 0} requested scopes • {app.isPopular ? 'Popular app' : 'Standard app'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Pre-Approval Policy Toggle */}
                  <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={app.approvalRequired}
                      onChange={() => handleToggleApprovalRequired(app.integrationId, app.approvalRequired)}
                      className="accent-blue-600 rounded"
                    />
                    <span className="text-[11px]">Require Admin Approval</span>
                  </label>

                  {/* Disable/Enable Button */}
                  <button
                    onClick={() => handleToggleAppStatus(app.integrationId, app.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      app.status === 'DISABLED_BY_ADMIN'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                    }`}
                  >
                    {app.status === 'DISABLED_BY_ADMIN' ? 'Enable' : 'Disable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Enterprise audit trail tracking all third-party authorization grants, calendar synchronizations, and webhook dispatch events.
          </p>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">App / Provider</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map(log => (
                  <tr key={log.auditId || log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{log.userName || log.userId}</td>
                    <td className="py-3 px-4 font-bold text-gray-700 uppercase">{log.provider}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 truncate max-w-xs text-[11px]">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
