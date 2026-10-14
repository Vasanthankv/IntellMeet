import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart2, TrendingUp, Clock, Users, ShieldCheck, FileText, Download,
  Search, Calendar, Filter, ArrowUpRight, Activity, Wifi, Monitor,
  Smartphone, Video, Mic, Share2, Sparkles, RefreshCw, Radio,
  CheckCircle2, AlertTriangle, XCircle, ChevronRight, ChevronLeft,
  UserCheck, Cpu, Layers, ExternalLink, HelpCircle
} from 'lucide-react';

export default function AnalyticsReportsView() {
  const [subTab, setSubTab] = useState('overview'); // 'overview' | 'meetings' | 'hosts' | 'quality' | 'features' | 'ai' | 'export'
  const [range, setRange] = useState('30d');
  const [department, setDepartment] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [meetingsData, setMeetingsData] = useState({ meetings: [], pagination: {} });
  const [hostsData, setHostsData] = useState([]);
  const [qualityData, setQualityData] = useState(null);
  const [featuresData, setFeaturesData] = useState(null);
  const [aiData, setAiData] = useState(null);

  // Participant Drill-down Modal
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [participantModalData, setParticipantModalData] = useState(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Fetch Overview
  const fetchOverview = async () => {
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/analytics/overview?range=${range}&department=${department}`);
      const data = await res.json();
      if (data.success) {
        setOverviewData(data);
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
    }
  };

  // Fetch Meetings
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        search: searchQuery,
        range,
        department,
        type: typeFilter,
      });
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/analytics/meetings?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setMeetingsData(data);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Hosts
  const fetchHosts = async () => {
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/analytics/hosts?range=${range}`);
      const data = await res.json();
      if (data.success) {
        setHostsData(data.hosts || []);
      }
    } catch (err) {
      console.error('Error fetching hosts:', err);
    }
  };

  // Fetch Quality
  const fetchQuality = async () => {
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/analytics/quality?range=${range}`);
      const data = await res.json();
      if (data.success) {
        setQualityData(data);
      }
    } catch (err) {
      console.error('Error fetching quality:', err);
    }
  };

  // Fetch Features
  const fetchFeatures = async () => {
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/analytics/features?range=${range}`);
      const data = await res.json();
      if (data.success) {
        setFeaturesData(data);
      }
    } catch (err) {
      console.error('Error fetching features:', err);
    }
  };

  // Fetch AI
  const fetchAI = async () => {
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/analytics/ai?range=${range}`);
      const data = await res.json();
      if (data.success) {
        setAiData(data);
      }
    } catch (err) {
      console.error('Error fetching AI analytics:', err);
    }
  };

  // Drill down into meeting participants
  const handleOpenParticipants = async (meetingId) => {
    setSelectedMeetingId(meetingId);
    setLoadingParticipants(true);
    try {
      const res = await fetch(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/analytics/meetings/${meetingId}/participants`);
      const data = await res.json();
      if (data.success) {
        setParticipantModalData(data);
      } else {
        toast.error('Could not load participant attendance');
      }
    } catch (err) {
      toast.error('Network error loading participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Download Meetings CSV
  const handleDownloadMeetingsCsv = () => {
    window.open(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/analytics/export/meetings.csv?range=${range}&department=${department}`, '_blank');
    toast.success('Downloading meeting history report CSV...');
  };

  // Download Attendance CSV
  const handleDownloadAttendanceCsv = (mId) => {
    window.open(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/analytics/export/participants/${mId}.csv`, '_blank');
    toast.success('Downloading attendee attendance report CSV...');
  };


  const fetchAllData = () => {
    fetchOverview();
    fetchMeetings();
    fetchHosts();
    fetchQuality();
    fetchFeatures();
    fetchAI();
  };

  useEffect(() => {
    fetchAllData();
  }, [range, department]);

  useEffect(() => {
    fetchMeetings();
  }, [page, searchQuery, typeFilter]);

  // Format Helpers
  const formatMins = (mins) => {
    if (!mins && mins !== 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Analytics Toolbar & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-700">
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${range === '7d' ? 'bg-white shadow-sm text-blue-600' : 'hover:text-gray-900'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${range === '30d' ? 'bg-white shadow-sm text-blue-600' : 'hover:text-gray-900'}`}
            >
              30 Days
            </button>
            <button
              onClick={() => setRange('90d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${range === '90d' ? 'bg-white shadow-sm text-blue-600' : 'hover:text-gray-900'}`}
            >
              90 Days
            </button>
            <button
              onClick={() => setRange('1y')}
              className={`px-3 py-1.5 rounded-lg transition-all ${range === '1y' ? 'bg-white shadow-sm text-blue-600' : 'hover:text-gray-900'}`}
            >
              1 Year
            </button>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Dept:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product Design">Product Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales & Success">Sales & Success</option>
              <option value="Security & Operations">Security & Operations</option>
              <option value="Executive Leadership">Executive Leadership</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAllData}
            title="Refresh analytics data"
            className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadMeetingsCsv}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export Meetings CSV
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: BarChart2 },
          { id: 'meetings', label: 'Meeting History & Reports', icon: FileText },
          { id: 'hosts', label: 'Host Analytics', icon: Users },
          { id: 'quality', label: 'Quality & Diagnostics', icon: Activity },
          { id: 'features', label: 'Feature Adoption', icon: Layers },
          { id: 'ai', label: 'AI Intelligence', icon: Sparkles },
          { id: 'export', label: 'CSV Export Center', icon: Download },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: OVERVIEW DASHBOARD */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Performance Indicators (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Meetings</span>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">
                {overviewData?.kpis?.totalMeetings ?? '—'}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> Active across org
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Meeting Minutes</span>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">
                {overviewData?.kpis?.meetingMinutes ? formatMins(overviewData.kpis.meetingMinutes) : '—'}
              </p>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                Total host stream time
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Attendees</span>
              <p className="text-2xl font-extrabold text-purple-600 mt-1">
                {overviewData?.kpis?.totalParticipants ?? '—'}
              </p>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                Unique & repeated joins
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Participant Minutes</span>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                {overviewData?.kpis?.totalParticipantMinutes ? formatMins(overviewData.kpis.totalParticipantMinutes) : '—'}
              </p>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                Cumulative session time
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Active Hosts</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                {overviewData?.kpis?.activeHosts ?? '—'}
              </p>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                Licensed organizers
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Avg Quality Score</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {overviewData?.kpis?.avgQualityScore ? `${overviewData.kpis.avgQualityScore}%` : '95%'}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> High clarity index
              </span>
            </div>
          </div>

          {/* Usage Trends Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Meeting Volume & Participant Minutes Trend
                </h3>
                <p className="text-xs text-gray-500">Daily session count and participant engagement time over selected period</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-gray-600 font-medium">Meetings Count</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-indigo-400" />
                  <span className="text-gray-600 font-medium">Participant Minutes (x10)</span>
                </div>
              </div>
            </div>

            {/* Custom SVG Trend Graph */}
            <div className="h-64 w-full pt-4 flex flex-col justify-end">
              {overviewData?.trends && overviewData.trends.length > 0 ? (
                <div className="h-full flex items-end gap-2 overflow-x-auto pb-4 pt-2">
                  {overviewData.trends.map((t, idx) => {
                    const maxMtg = Math.max(...overviewData.trends.map(x => x.meetings), 1);
                    const heightPct = Math.max(15, Math.min(100, (t.meetings / maxMtg) * 100));
                    return (
                      <div key={idx} className="flex-1 min-w-[32px] flex flex-col items-center gap-1 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-12 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                          <div><strong>{t.date}</strong></div>
                          <div>{t.meetings} meetings • {t.participants} attendees</div>
                        </div>

                        {/* Bar */}
                        <div className="w-full flex items-end justify-center gap-1 h-44">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-3.5 bg-blue-600 rounded-t-md hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-gray-400 truncate max-w-[40px]">
                          {t.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No trend data available for this range
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Section: Types & Quick Feature Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Meeting Type Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                Distribution by Meeting Format
              </h3>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-xs font-semibold text-blue-700">Scheduled Meetings</span>
                  <p className="text-xl font-bold text-blue-900 mt-1">
                    {overviewData?.typeDistribution?.scheduled || 0}
                  </p>
                  <span className="text-[10px] text-blue-600">Standard calendar calendar invites</span>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-xs font-semibold text-emerald-700">Recurring Series</span>
                  <p className="text-xl font-bold text-emerald-900 mt-1">
                    {overviewData?.typeDistribution?.recurring || 0}
                  </p>
                  <span className="text-[10px] text-emerald-600">Weekly standups & 1-on-1s</span>
                </div>

                <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
                  <span className="text-xs font-semibold text-purple-700">Webinars & Townhalls</span>
                  <p className="text-xl font-bold text-purple-900 mt-1">
                    {overviewData?.typeDistribution?.webinar || 0}
                  </p>
                  <span className="text-[10px] text-purple-600">All-hands & broadcast events</span>
                </div>

                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-xs font-semibold text-amber-700">Instant Meetings</span>
                  <p className="text-xl font-bold text-amber-900 mt-1">
                    {overviewData?.typeDistribution?.instant || 0}
                  </p>
                  <span className="text-[10px] text-amber-600">One-click quick huddles</span>
                </div>
              </div>
            </div>

            {/* Quick Diagnostic Health */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Network & Stream Quality Health
              </h3>
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Good Experience (No Jitter)
                    </span>
                    <span className="text-gray-900 font-bold">{qualityData?.ratings?.goodPct || 85}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div style={{ width: `${qualityData?.ratings?.goodPct || 85}%` }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Fair (Minor Packet Loss)
                    </span>
                    <span className="text-gray-900 font-bold">{qualityData?.ratings?.fairPct || 10}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div style={{ width: `${qualityData?.ratings?.fairPct || 10}%` }} className="h-full bg-amber-400 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-700 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-500" /> Poor (High Latency / Reconnects)
                    </span>
                    <span className="text-gray-900 font-bold">{qualityData?.ratings?.poorPct || 5}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div style={{ width: `${qualityData?.ratings?.poorPct || 5}%` }} className="h-full bg-rose-500 rounded-full" />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                  <span>Avg Latency: <strong>{qualityData?.networkAverages?.avgLatencyMs || 45} ms</strong></span>
                  <span>Avg Packet Loss: <strong>{qualityData?.networkAverages?.avgPacketLossPct || 0.3}%</strong></span>
                  <span>Total Reconnects: <strong>{qualityData?.networkAverages?.totalReconnections || 0}</strong></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 2: MEETING HISTORY & REPORTS (34.2, 34.14) */}
      {subTab === 'meetings' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, host name, email, or meeting ID..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="all">All Formats</option>
                <option value="scheduled">Scheduled</option>
                <option value="recurring">Recurring</option>
                <option value="webinar">Webinar</option>
                <option value="instant">Instant</option>
              </select>

              <button
                onClick={handleDownloadMeetingsCsv}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export Filtered CSV
              </button>
            </div>
          </div>

          {/* Historical Meetings Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Meeting Topic & ID</th>
                    <th className="py-3 px-4">Host & Department</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-center">Duration</th>
                    <th className="py-3 px-4 text-center">Attendees</th>
                    <th className="py-3 px-4 text-center">Total Min</th>
                    <th className="py-3 px-4 text-center">Quality</th>
                    <th className="py-3 px-4">Features Used</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {meetingsData.meetings && meetingsData.meetings.length > 0 ? (
                    meetingsData.meetings.map(m => (
                      <tr key={m._id || m.meetingId} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900 block truncate max-w-xs">{m.topic}</span>
                          <span className="text-[11px] font-mono text-gray-500">ID: {m.meetingNumericId || m.meetingId}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-800 block">{m.hostName}</span>
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">{m.department}</span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          <div>{new Date(m.startTime).toLocaleDateString()}</div>
                          <span className="text-[10px] text-gray-400">{new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-gray-800">
                          {m.durationMinutes} min
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-full text-[11px]">
                            {m.participantCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium text-gray-600">
                          {m.totalParticipantMinutes}m
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.quality?.rating === 'Poor'
                              ? 'bg-rose-100 text-rose-700'
                              : m.quality?.rating === 'Fair'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {m.quality?.rating || 'Good'} ({m.quality?.overallScore || 95}%)
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {m.featureUsage?.screenShare && (
                              <span title="Screen Share" className="p-1 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">
                                <Share2 className="w-3 h-3" />
                              </span>
                            )}
                            {m.featureUsage?.recording && (
                              <span title="Recorded" className="p-1 bg-rose-50 text-rose-600 rounded text-[10px] font-bold">
                                REC
                              </span>
                            )}
                            {m.featureUsage?.aiSummary && (
                              <span title="AI Summary Active" className="p-1 bg-purple-50 text-purple-600 rounded text-[10px] font-bold">
                                <Sparkles className="w-3 h-3" />
                              </span>
                            )}
                            {m.featureUsage?.liveStreaming && (
                              <span title="Live Streamed" className="p-1 bg-red-50 text-red-600 rounded text-[10px] font-bold">
                                <Radio className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenParticipants(m.meetingId)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-xl text-xs transition-colors"
                          >
                            Attendance Drill-down
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-xs text-gray-400">
                        {loading ? 'Loading meeting records...' : 'No historical meetings found for this filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {meetingsData.pagination?.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing page {meetingsData.pagination.page} of {meetingsData.pagination.totalPages} ({meetingsData.pagination.total} total meetings)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= meetingsData.pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: HOST ANALYTICS (34.4) */}
      {subTab === 'hosts' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Licensed Host Meeting Activity & Durations
            </h3>
            <p className="text-xs text-gray-500 mb-4">Cumulative meetings, attendee engagement, and quality indices per licensed host</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Host Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Meetings Hosted</th>
                    <th className="py-3 px-4 text-center">Total Minutes</th>
                    <th className="py-3 px-4 text-center">Total Attendees</th>
                    <th className="py-3 px-4 text-center">Avg Duration</th>
                    <th className="py-3 px-4 text-center">Avg Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hostsData && hostsData.length > 0 ? (
                    hostsData.map((h, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{h.hostName}</td>
                        <td className="py-3.5 px-4 text-gray-500 font-mono">{h._id || '—'}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                            {h.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-blue-600">{h.totalMeetings}</td>
                        <td className="py-3.5 px-4 text-center font-medium text-gray-700">{formatMins(h.totalMinutes)}</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-purple-600">{h.totalParticipants}</td>
                        <td className="py-3.5 px-4 text-center text-gray-600">{Math.round(h.avgDuration)} mins</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                            {Math.round(h.avgScore || 92)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-xs text-gray-400">
                        No host activity recorded for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: QUALITY & DIAGNOSTICS (34.6, 34.8) */}
      {subTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Overall Good Experience</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                {qualityData?.ratings?.goodPct || 85}%
              </p>
              <span className="text-[11px] text-gray-500 mt-1 block">Meetings with zero degradation</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Average Jitter</span>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">
                {qualityData?.networkAverages?.avgJitterMs || 10} ms
              </p>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Optimal (&lt; 30 ms)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Average Packet Loss</span>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                {qualityData?.networkAverages?.avgPacketLossPct || 0.3}%
              </p>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Ultra-low loss (&lt; 2%)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Reconnection Events</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {qualityData?.networkAverages?.totalReconnections || 0}
              </p>
              <span className="text-[11px] text-gray-500 mt-1 block">Transient network drops</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Stream Quality Breakdown by Media Track
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-gray-900 text-xs">Audio Stream Quality</span>
                </div>
                <div className="text-xl font-extrabold text-emerald-600">98.4% Good</div>
                <p className="text-[11px] text-gray-500">Opus codec with dynamic acoustic echo cancellation and background noise suppression active.</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-gray-900 text-xs">Video Stream Quality</span>
                </div>
                <div className="text-xl font-extrabold text-emerald-600">94.8% Good</div>
                <p className="text-[11px] text-gray-500">VP9/H.264 simulcast with automatic bitrate adaptation down to 360p under bandwidth constraints.</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-gray-900 text-xs">Screen Sharing Quality</span>
                </div>
                <div className="text-xl font-extrabold text-emerald-600">97.2% Good</div>
                <p className="text-[11px] text-gray-500">Optimized for high-resolution text clarity with 30fps motion smoothing for shared video clips.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: FEATURE ADOPTION (34.7) */}
      {subTab === 'features' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              IntelliMeet Core Feature Adoption Across Account
            </h3>
            <p className="text-xs text-gray-500">Percentage of meetings utilizing each interactive feature</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {[
                { key: 'audio', label: 'VoIP Audio', icon: Mic, color: 'blue' },
                { key: 'video', label: 'Participant Video', icon: Video, color: 'purple' },
                { key: 'screenShare', label: 'Screen Sharing', icon: Share2, color: 'indigo' },
                { key: 'recording', label: 'Cloud Recording', icon: Radio, color: 'rose' },
                { key: 'aiSummary', label: 'Gemini AI Summary', icon: Sparkles, color: 'amber' },
                { key: 'aiQuestions', label: 'AI Meeting Q&A', icon: Sparkles, color: 'emerald' },
                { key: 'breakoutRooms', label: 'Breakout Rooms', icon: Users, color: 'teal' },
                { key: 'whiteboard', label: 'Infinite Whiteboard', icon: Monitor, color: 'cyan' },
                { key: 'polls', label: 'In-Meeting Polls', icon: CheckCircle2, color: 'orange' },
                { key: 'captions', label: 'Live Automated Captions', icon: FileText, color: 'violet' },
                { key: 'liveStreaming', label: 'Multi-platform Live Stream', icon: Radio, color: 'red' },
                { key: 'interpretation', label: 'Language Interpretation', icon: Activity, color: 'pink' },
              ].map(f => {
                const stat = featuresData?.features?.[f.key] || { percentage: 0, count: 0 };
                const Icon = f.icon;
                return (
                  <div key={f.key} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-800 flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-600" />
                        {f.label}
                      </span>
                      <span className="text-sm font-extrabold text-gray-900">{stat.percentage}%</span>
                    </div>
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div style={{ width: `${stat.percentage}%` }} className="h-full bg-blue-600 rounded-full" />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 block">{stat.count} meetings adopted</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: AI INTELLIGENCE (34.11, 34.16) */}
      {subTab === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Summaries Generated</span>
              <p className="text-2xl font-extrabold text-purple-600 mt-1">
                {aiData?.aiSummaryCount ?? '—'}
              </p>
              <span className="text-[11px] text-gray-500 mt-1 block">Gemini 2.5 Flash summaries</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Questions Answered</span>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">
                {aiData?.aiQuestionsAnswered ?? '—'}
              </p>
              <span className="text-[11px] text-gray-500 mt-1 block">Contextual meeting queries</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Action Items Detected</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                {aiData?.actionItemsDetected ?? '—'}
              </p>
              <span className="text-[11px] text-gray-500 mt-1 block">Assigned with owners & deadlines</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Decisions Recorded</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {aiData?.decisionsRecorded ?? '—'}
              </p>
              <span className="text-[11px] text-gray-500 mt-1 block">Architectural & product decisions</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Transcripts Indexed</span>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                {aiData?.transcriptsProcessed ?? '—'}
              </p>
              <span className="text-[11px] text-gray-500 mt-1 block">Deep search ready</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              IntelliMeet AI Companion Impact & Time Savings
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Automated AI summaries and smart recordings have saved approximately{' '}
              <strong className="text-purple-700 font-bold">
                {Math.round(((aiData?.aiSummaryCount || 10) * 18) / 60)} hours
              </strong>{' '}
              of post-meeting note taking and catch-up time across your enterprise account this month.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: CSV EXPORT CENTER (34.10, 34.20) */}
      {subTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              Historical Data & Audit CSV Export Center
            </h3>
            <p className="text-xs text-gray-500">
              Download complete raw datasets for compliance audits, custom business intelligence dashboards, or human resources attendance tracking.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Meeting History & Host Activity Report
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Includes Meeting ID, Topic, Host details, Department, Meeting Format, Start/End timestamps, Duration, Total attendee minutes, Quality scores, and Feature flags.
                  </p>
                </div>
                <button
                  onClick={handleDownloadMeetingsCsv}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" /> Export Meetings Report (.CSV)
                </button>
              </div>

              <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    Participant Attendance Reports
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1">
                    To export individual attendance logs with join/leave timestamps, waiting room wait durations, device models, and network metrics, browse to <strong>Meeting History & Reports</strong> and click <strong>Attendance Drill-down</strong>.
                  </p>
                </div>
                <button
                  onClick={() => setSubTab('meetings')}
                  className="border border-purple-300 hover:bg-purple-50 text-purple-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  Go to Meeting History <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PARTICIPANT ATTENDANCE DRILL-DOWN MODAL (34.3, 34.10, 34.15) */}
      {selectedMeetingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>Attendance Drill-down</span>
                  <span>•</span>
                  <span className="font-mono text-blue-600">ID: {participantModalData?.meeting?.meetingNumericId || selectedMeetingId}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base mt-0.5">
                  {participantModalData?.meeting?.topic || 'Meeting Attendance Report'}
                </h3>
                <span className="text-xs text-gray-500">
                  Host: <strong>{participantModalData?.meeting?.hostName}</strong> • {participantModalData?.totalAttendees || 0} participants recorded
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadAttendanceCsv(selectedMeetingId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button
                  onClick={() => {
                    setSelectedMeetingId(null);
                    setParticipantModalData(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body: Attendance Table */}
            <div className="p-5 overflow-y-auto flex-1">
              {loadingParticipants ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  Loading attendee records and telemetry...
                </div>
              ) : participantModalData?.participants?.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Participant Name</th>
                        <th className="py-2.5 px-3">Join / Leave Time</th>
                        <th className="py-2.5 px-3 text-center">Session Duration</th>
                        <th className="py-2.5 px-3 text-center">Waiting Room</th>
                        <th className="py-2.5 px-3">Device & Network</th>
                        <th className="py-2.5 px-3 text-center">Media Flags</th>
                        <th className="py-2.5 px-3 text-center">Quality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {participantModalData.participants.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-gray-900 block">{p.displayName}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{p.email || 'guest@external'}</span>
                            {p.isGuest && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-50 text-amber-700 text-[9px] font-bold rounded">
                                Guest
                              </span>
                            )}
                            {p.consolidatedEntries > 1 && (
                              <span className="inline-block ml-1 mt-0.5 px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[9px] font-bold rounded">
                                Rejoined ({p.consolidatedEntries}x)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            <div>In: {new Date(p.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-gray-400">Out: {new Date(p.leftAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-gray-800">
                            {p.durationMinutes} min
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-600">
                            {p.waitingRoomDurationMinutes > 0 ? (
                              <span className="text-amber-700 font-semibold">{p.waitingRoomDurationMinutes} min</span>
                            ) : (
                              <span className="text-gray-400">0 min</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-gray-800 block text-[11px]">{p.device}</span>
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-medium">
                              {p.networkType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {p.audioUsed && <span title="Microphone Active" className="p-1 bg-gray-100 rounded text-gray-700"><Mic className="w-3 h-3" /></span>}
                              {p.videoUsed && <span title="Camera Active" className="p-1 bg-purple-50 text-purple-600 rounded"><Video className="w-3 h-3" /></span>}
                              {p.screenShareUsed && <span title="Screen Shared" className="p-1 bg-blue-50 text-blue-600 rounded"><Share2 className="w-3 h-3" /></span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.qualityRating === 'Poor'
                                ? 'bg-rose-100 text-rose-700'
                                : p.qualityRating === 'Fair'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {p.qualityRating}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  No attendance records found for this meeting ID.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Attendance entries automatically consolidated per participant identity (Zoom 34.10 compliance).
              </span>
              <button
                onClick={() => {
                  setSelectedMeetingId(null);
                  setParticipantModalData(null);
                }}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
