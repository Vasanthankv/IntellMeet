import React, { useState, useEffect } from 'react';
import { 
  Calendar, MessageSquare, Check, RefreshCw, Plus, ExternalLink, 
  Trash2, ShieldCheck, Zap, Globe, Layers, ArrowUpRight, CheckCircle2, 
  AlertTriangle, Radio, Code2, Copy, Send, Settings, Sliders, Info, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import AddToCalendarDropdown from './AddToCalendarDropdown';

export default function IntegrationsWorkspace({ isAdminView = false }) {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [marketplaceApps, setMarketplaceApps] = useState([]);
  const [connectedApps, setConnectedApps] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingCalendar, setSyncingCalendar] = useState(false);

  // Connect App Modal State (Section 39.14 & 39.15)
  const [selectedAppToConnect, setSelectedAppToConnect] = useState(null);
  const [selectedScopes, setSelectedScopes] = useState([]);
  const [accountEmailInput, setAccountEmailInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Webhook Creation Form Modal State (Section 39.19)
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [webhookEndpoint, setWebhookEndpoint] = useState('');
  const [webhookEvents, setWebhookEvents] = useState(['meeting.completed', 'summary.generated', 'action_item.created']);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [marketRes, myRes, whRes] = await Promise.all([
        fetch('http://localhost:5000/api/integrations/marketplace', { headers }),
        fetch('http://localhost:5000/api/integrations/my', { headers }),
        fetch('http://localhost:5000/api/integrations/webhooks', { headers })
      ]);

      const [marketData, myData, whData] = await Promise.all([
        marketRes.json(),
        myRes.json(),
        whRes.json()
      ]);

      if (marketData.success) setMarketplaceApps(marketData.apps || []);
      if (myData.success) setConnectedApps(myData.connected || []);
      if (whData.success) setWebhooks(whData.webhooks || []);
    } catch (err) {
      console.error('Error fetching integrations data:', err);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Connect App OAuth Handler
  const handleInitiateConnect = (app) => {
    setSelectedAppToConnect(app);
    setSelectedScopes(app.requestedPermissions?.map(p => p.scope) || []);
    setAccountEmailInput('user@example.com');
  };

  const handleConfirmConnect = async () => {
    if (!selectedAppToConnect) return;
    setIsConnecting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/integrations/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          integrationId: selectedAppToConnect.integrationId,
          accountEmail: accountEmailInput,
          scopes: selectedScopes
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSelectedAppToConnect(null);
        fetchData();
      } else {
        toast.error(data.message || 'Connection failed');
      }
    } catch (err) {
      toast.error('Network error during connection');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect App Handler
  const handleDisconnect = async (integrationId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/integrations/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ integrationId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Disconnected ${integrationId}`);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to disconnect');
      }
    } catch (err) {
      toast.error('Network error disconnecting app');
    }
  };

  // 2-Way Calendar Sync
  const handleCalendarSync = async (provider = 'GOOGLE') => {
    setSyncingCalendar(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/integrations/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ provider })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.message || 'Calendar sync failed. Is your calendar connected?');
      }
    } catch (err) {
      toast.error('Network error syncing calendar');
    } finally {
      setSyncingCalendar(false);
    }
  };

  // Webhook Handlers
  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!webhookEndpoint) return;
    setIsCreatingWebhook(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/integrations/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: webhookName || 'Custom Automation Webhook',
          endpoint: webhookEndpoint,
          events: webhookEvents
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Webhook created successfully!');
        setShowAddWebhook(false);
        setWebhookName('');
        setWebhookEndpoint('');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to create webhook');
      }
    } catch (err) {
      toast.error('Network error creating webhook');
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const handleTestWebhook = async (webhookId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/integrations/webhooks/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ webhookId, event: 'meeting.completed' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error('Error sending test webhook event');
    }
  };

  const handleDeleteWebhook = async (subscriptionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/integrations/webhooks/${subscriptionId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Webhook subscription deleted');
        fetchData();
      }
    } catch (e) {
      toast.error('Error deleting webhook');
    }
  };

  const isConnected = (id) => connectedApps.some(c => c.integrationId === id && c.status === 'CONNECTED');
  const isPending = (id) => connectedApps.some(c => c.integrationId === id && c.status === 'PENDING_APPROVAL');

  const filteredApps = marketplaceApps.filter(app => {
    if (activeCategory === 'ALL') return true;
    return app.category === activeCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2E2E2E] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white">Platform Integrations & Marketplace</h2>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-extrabold px-2 py-0.5 rounded-full border border-blue-500/30">
              Part 39
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Connect IntelliMeet meetings with external calendar, chat, document, CRM, and automation tools
          </p>
        </div>

        {/* Global Calendar Sync Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCalendarSync('GOOGLE')}
            disabled={syncingCalendar}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            title="Sync all upcoming meetings between IntelliMeet and connected calendars"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingCalendar ? 'animate-spin' : ''}`} />
            <span>{syncingCalendar ? 'Syncing...' : 'Sync Calendar Now'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CALENDAR INTEGRATIONS QUICK-CONNECT (Sections 39.1 - 39.5) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Calendar Integrations (39.1 - 39.5)
          </h3>
          <span className="text-[11px] text-gray-400">Two-way sync & meeting link injection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'google-calendar',
              name: 'Google Calendar',
              provider: 'GOOGLE',
              desc: 'Sync events, invite attendees & check free/busy availability',
              dot: 'bg-blue-500'
            },
            {
              id: 'microsoft-365',
              name: 'Microsoft 365 / Outlook',
              provider: 'MICROSOFT',
              desc: 'Schedule via Outlook Web/Desktop add-in with passcodes',
              dot: 'bg-sky-500'
            },
            {
              id: 'outlook-desktop',
              name: 'Outlook & Exchange',
              provider: 'MICROSOFT',
              desc: 'Direct Exchange calendar sync & room booking integration',
              dot: 'bg-cyan-500'
            }
          ].map(cal => {
            const connected = isConnected(cal.id);
            return (
              <div key={cal.id} className="bg-[#242424] border border-[#333] rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cal.dot}`}></span>
                      {cal.name}
                    </span>
                    {connected ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Not Connected</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{cal.desc}</p>
                </div>

                <div className="pt-2 border-t border-[#2F2F2F] flex items-center justify-between">
                  {connected ? (
                    <>
                      <button
                        onClick={() => handleCalendarSync(cal.provider)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Sync Now
                      </button>
                      <button
                        onClick={() => handleDisconnect(cal.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleInitiateConnect(marketplaceApps.find(a => a.integrationId === cal.id) || { integrationId: cal.id, name: cal.name, provider: cal.provider })}
                      className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all text-center"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CONNECTED APPS DASHBOARD (Section 39.16) */}
      {connectedApps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Your Connected Apps ({connectedApps.length})
          </h3>

          <div className="bg-[#242424] border border-[#333] rounded-2xl overflow-hidden divide-y divide-[#2F2F2F]">
            {connectedApps.map(item => (
              <div key={item.userIntegrationId} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#333] flex items-center justify-center font-bold text-sm text-blue-400">
                    {item.provider?.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{item.appDetails?.name || item.integrationId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        item.status === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-3 mt-0.5">
                      <span>{item.accountEmail || 'Connected Account'}</span>
                      {item.lastSyncedAt && (
                        <span>• Last synced {new Date(item.lastSyncedAt).toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDisconnect(item.integrationId)}
                    className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: APP MARKETPLACE BROWSER (Section 39.13) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              Integration Marketplace
            </h3>
            <p className="text-xs text-gray-400">Browse apps across Calendar, Chat, Documents, Project Tools, CRM & Automation</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'CALENDAR', label: 'Calendar' },
              { id: 'COMMUNICATION', label: 'Chat & Teams' },
              { id: 'COLLABORATION', label: 'Drive & Docs' },
              { id: 'PROJECT_MANAGEMENT', label: 'Jira & Asana' },
              { id: 'CRM', label: 'Salesforce & CRM' },
              { id: 'AUTOMATION', label: 'Zapier & Webhooks' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-[#242424] text-gray-400 hover:text-white hover:bg-[#2C2C2C]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map(app => {
            const connected = isConnected(app.integrationId);
            const pending = isPending(app.integrationId);

            return (
              <div 
                key={app.integrationId} 
                className="bg-[#242424] border border-[#333] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-gray-600 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#333] flex items-center justify-center font-bold text-sm text-blue-400 shadow-inner">
                        {app.provider?.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                          {app.name}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          {app.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {app.isPopular && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 font-extrabold px-2 py-0.5 rounded-full border border-purple-500/30">
                        Popular
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">{app.tagline || app.description}</p>

                  {/* Feature Pills */}
                  {app.supportedFeatures?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {app.supportedFeatures.slice(0, 3).map((feat, idx) => (
                        <span key={idx} className="text-[10px] bg-[#1A1A1A] border border-[#333] text-gray-300 px-2 py-0.5 rounded-lg">
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#2F2F2F] flex items-center justify-between">
                  {connected ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Installed
                      </span>
                      <button
                        onClick={() => handleDisconnect(app.integrationId)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium"
                      >
                        Uninstall
                      </button>
                    </div>
                  ) : pending ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-amber-400 font-bold">
                        ⏳ Pending Approval
                      </span>
                      <button
                        onClick={() => handleDisconnect(app.integrationId)}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInitiateConnect(app)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: DEVELOPER PLATFORM & WEBHOOKS (Section 39.19 & 39.20) */}
      <div className="space-y-4 pt-4 border-t border-[#2E2E2E]">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              Developer Platform & Custom Webhooks (39.19)
            </h3>
            <p className="text-xs text-gray-400">Subscribe external servers, Zapier, or microservices to live meeting events</p>
          </div>

          <button
            onClick={() => setShowAddWebhook(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Webhook</span>
          </button>
        </div>

        {webhooks.length > 0 ? (
          <div className="bg-[#242424] border border-[#333] rounded-2xl overflow-hidden divide-y divide-[#2F2F2F]">
            {webhooks.map(wh => (
              <div key={wh.subscriptionId} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-white">{wh.name}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      {wh.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestWebhook(wh.subscriptionId)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-gray-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Send className="w-3 h-3 text-blue-400" />
                      Test Ping
                    </button>
                    <button
                      onClick={() => handleDeleteWebhook(wh.subscriptionId)}
                      className="p-1 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-mono text-gray-400 truncate">
                  Endpoint: <span className="text-emerald-400">{wh.endpoint}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {wh.events?.map((evt, idx) => (
                    <span key={idx} className="bg-[#1A1A1A] border border-[#333] px-2 py-0.5 rounded text-gray-300">
                      ⚡ {evt}
                    </span>
                  ))}
                  <span className="text-gray-500 ml-auto">
                    Deliveries: {wh.deliveryCount || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-[#242424] border border-dashed border-[#333] rounded-2xl text-center space-y-2">
            <Zap className="w-8 h-8 text-gray-500 mx-auto" />
            <div className="text-xs font-semibold text-gray-300">No Webhook Subscriptions Configured</div>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              Add a webhook URL to receive instant JSON notifications when meetings are scheduled, transcripts are generated, or action items are created.
            </p>
          </div>
        )}
      </div>

      {/* MODAL 1: OAUTH 2.0 LEAST PRIVILEGE CONSENT DIALOG (Section 39.14 & 39.15) */}
      {selectedAppToConnect && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] text-white border border-[#3A3A3A] rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-[#333] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  {selectedAppToConnect.provider?.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Connect {selectedAppToConnect.name}</h3>
                  <p className="text-xs text-gray-400">OAuth 2.0 Authorization & Scope Selection</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAppToConnect(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Email */}
            <div className="space-y-1 text-xs">
              <label className="text-gray-400 font-medium">Account Email to Link:</label>
              <input
                type="email"
                value={accountEmailInput}
                onChange={e => setAccountEmailInput(e.target.value)}
                className="w-full bg-[#2A2A2A] border border-[#444] rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
              />
            </div>

            {/* Least Privilege Permissions Selection (Section 39.14) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-300">Requested Permissions (Least Privilege):</span>
                <span className="text-[10px] text-blue-400">Granular Scopes</span>
              </div>

              <div className="space-y-2 bg-[#252525] p-3 rounded-2xl border border-[#333] max-h-48 overflow-y-auto">
                {selectedAppToConnect.requestedPermissions?.map(p => {
                  const isChecked = selectedScopes.includes(p.scope);
                  return (
                    <label key={p.scope} className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedScopes(prev => [...prev, p.scope]);
                          } else {
                            setSelectedScopes(prev => prev.filter(s => s !== p.scope));
                          }
                        }}
                        className="mt-0.5 rounded accent-blue-600"
                      />
                      <div>
                        <div className="font-semibold text-white">{p.label}</div>
                        <div className="text-[10px] text-gray-400 leading-tight">{p.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[11px] text-gray-300 leading-relaxed">
              🔒 <strong>Security Guarantee:</strong> Credentials are encrypted with AES-256-CBC and stored securely on the backend server.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedAppToConnect(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConnect}
                disabled={isConnecting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isConnecting ? 'Authorizing...' : 'Authorize & Connect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD WEBHOOK MODAL (Section 39.19) */}
      {showAddWebhook && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateWebhook} className="bg-[#1F1F1F] text-white border border-[#3A3A3A] rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-[#333] pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                Create Webhook Subscription
              </h3>
              <button type="button" onClick={() => setShowAddWebhook(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-gray-300 font-medium">Webhook Name:</label>
              <input
                type="text"
                required
                value={webhookName}
                onChange={e => setWebhookName(e.target.value)}
                placeholder="e.g. Zapier Workflow, Internal Slack Bot"
                className="w-full bg-[#2A2A2A] border border-[#444] rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-gray-300 font-medium">Endpoint URL (HTTPS):</label>
              <input
                type="url"
                required
                value={webhookEndpoint}
                onChange={e => setWebhookEndpoint(e.target.value)}
                placeholder="https://your-server.com/api/intellmeet-webhook"
                className="w-full bg-[#2A2A2A] border border-[#444] rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs font-mono"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-gray-300 font-medium">Subscribe to Events:</label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  'meeting.created',
                  'meeting.completed',
                  'summary.generated',
                  'action_item.created',
                  'recording.ready',
                  'transcript.ready'
                ].map(evt => (
                  <label key={evt} className="flex items-center gap-2 text-[11px] text-gray-300 bg-[#252525] p-2 rounded-lg border border-[#333] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.includes(evt)}
                      onChange={e => {
                        if (e.target.checked) setWebhookEvents(prev => [...prev, evt]);
                        else setWebhookEvents(prev => prev.filter(x => x !== evt));
                      }}
                      className="accent-emerald-500"
                    />
                    <span className="truncate">{evt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddWebhook(false)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingWebhook}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                {isCreatingWebhook ? 'Creating...' : 'Register Webhook'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
