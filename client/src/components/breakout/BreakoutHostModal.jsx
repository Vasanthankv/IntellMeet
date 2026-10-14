import React, { useState, useEffect } from 'react';
import { 
  X, Users, Plus, Trash2, Edit2, Check, ArrowRight, 
  RotateCcw, Save, Radio, MessageSquare, Volume2, Share2, 
  HelpCircle, Clock, Shield, AlertTriangle, ChevronRight, 
  ChevronDown, ExternalLink, CornerDownRight, CheckCircle2,
  RefreshCw, LogOut, Send, Search
} from 'lucide-react';
import axios from 'axios';

export default function BreakoutHostModal({
  isOpen,
  onClose,
  meetingId,
  currentParticipants = [],
  currentUser = { id: 'host', name: 'Host' },
  socket = null,
  onJoinBreakoutRoom = () => {},
  isHost = true
}) {
  // Mode: 'CREATE' or 'MANAGE'
  const [viewState, setViewState] = useState('CREATE');
  
  // Creation Form State (18.2 - 18.6)
  const [roomCount, setRoomCount] = useState(2);
  const [assignmentMethod, setAssignmentMethod] = useState('AUTOMATIC'); // 'AUTOMATIC', 'MANUAL', 'PARTICIPANT_CHOICE', 'LOAD_SAVED'
  const [savedAssignments, setSavedAssignments] = useState([]);
  const [selectedSavedId, setSelectedSavedId] = useState('');
  
  // Options / Settings (18.20)
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    allowSelfSelect: false,
    allowReturnToMain: true,
    autoMoveParticipants: true,
    autoClose: false,
    durationMinutes: 30,
    countdownSeconds: 60,
    notifyHostOnExpiry: true
  });

  // Manage State (18.12, 18.25, 18.28)
  const [rooms, setRooms] = useState([]);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editNameText, setEditNameText] = useState('');
  const [selectedUserForMove, setSelectedUserForMove] = useState(null);
  const [selectedUserForExchange, setSelectedUserForExchange] = useState(null);
  const [showAssignDropdown, setShowAssignDropdown] = useState(null); // roomId or null

  // Broadcast & Share State (18.13, 18.14)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSharingToRooms, setIsSharingToRooms] = useState(false);

  // Save Assignment State (18.22)
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Fetch current rooms on modal open
  useEffect(() => {
    if (isOpen) {
      fetchRooms();
      fetchSavedAssignments();
    }
  }, [isOpen, meetingId]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout`);
      if (res.data.success && res.data.rooms?.length > 0) {
        setRooms(res.data.rooms);
        setViewState('MANAGE');
      } else {
        setViewState('CREATE');
      }
    } catch (err) {
      console.error('Error fetching breakout rooms:', err);
    }
  };

  const fetchSavedAssignments = async () => {
    try {
      const res = await axios.get(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/saved-assignments`);
      if (res.data.success) {
        setSavedAssignments(res.data.savedAssignments || []);
      }
    } catch (err) {
      console.error('Error fetching saved assignments:', err);
    }
  };

  // 1. Create Breakout Rooms (18.2 - 18.6)
  const handleCreateRooms = async () => {
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/create`, {
        count: roomCount,
        method: assignmentMethod,
        participants: currentParticipants.map(p => ({ userId: p.userId || p.id, userName: p.name || p.userName })),
        savedAssignmentId: selectedSavedId,
        settings: {
          ...settings,
          allowSelfSelect: assignmentMethod === 'PARTICIPANT_CHOICE' || settings.allowSelfSelect
        }
      });

      if (res.data.success) {
        setRooms(res.data.rooms);
        setViewState('MANAGE');
        if (socket) {
          socket.emit('breakout-create', meetingId, { rooms: res.data.rooms });
        }
      }
    } catch (err) {
      console.error('Error creating breakout rooms:', err);
    }
  };

  // 2. Open All Rooms (18.9)
  const handleOpenAllRooms = async () => {
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/open`);
      if (res.data.success) {
        setRooms(res.data.rooms);
        if (socket) {
          socket.emit('breakout-open', meetingId, {
            rooms: res.data.rooms,
            settings
          });
        }
      }
    } catch (err) {
      console.error('Error opening breakout rooms:', err);
    }
  };

  // 3. Initiate Closing Countdown (18.16, 18.18)
  const handleCloseAllRooms = async () => {
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/close`);
      if (res.data.success) {
        setRooms(res.data.rooms);
        if (socket) {
          socket.emit('breakout-close', meetingId, {
            countdownSeconds: settings.countdownSeconds
          });
        }
      }
    } catch (err) {
      console.error('Error closing breakout rooms:', err);
    }
  };

  // 4. Immediately End Rooms (18.16)
  const handleEndRoomsNow = async () => {
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/end`);
      if (res.data.success) {
        setRooms(res.data.rooms);
        setViewState('CREATE');
        if (socket) {
          socket.emit('breakout-end', meetingId, {});
        }
      }
    } catch (err) {
      console.error('Error ending rooms:', err);
    }
  };

  // 5. Add Room (18.21)
  const handleAddRoom = async () => {
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/rooms`, {
        name: `Room ${rooms.length + 1}`
      });
      if (res.data.success) {
        setRooms(prev => [...prev, res.data.room]);
      }
    } catch (err) {
      console.error('Error adding room:', err);
    }
  };

  // 6. Rename Room (18.8)
  const handleSaveRename = async (roomId) => {
    if (!editNameText.trim()) {
      setEditingRoomId(null);
      return;
    }
    try {
      const res = await axios.put(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/rooms/${roomId}`, {
        name: editNameText.trim()
      });
      if (res.data.success) {
        setRooms(prev => prev.map(r => r.roomId === roomId ? res.data.room : r));
        setEditingRoomId(null);
      }
    } catch (err) {
      console.error('Error renaming room:', err);
    }
  };

  // 7. Delete Room (18.21)
  const handleDeleteRoom = async (roomId) => {
    try {
      const res = await axios.delete(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/rooms/${roomId}`);
      if (res.data.success) {
        setRooms(prev => prev.filter(r => r.roomId !== roomId));
      }
    } catch (err) {
      console.error('Error deleting room:', err);
    }
  };

  // 8. Assign / Move Participant (18.4, 18.7)
  const handleAssignUser = async (userId, userName, targetRoomId) => {
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/assign`, {
        userId,
        userName,
        targetRoomId
      });
      if (res.data.success) {
        setRooms(res.data.rooms);
        setSelectedUserForMove(null);
        setShowAssignDropdown(null);
        if (socket) {
          socket.emit('breakout-assign', meetingId, { userId, targetRoomId });
        }
      }
    } catch (err) {
      console.error('Error assigning user:', err);
    }
  };

  // 9. Exchange Two Participants (18.7)
  const handleExchangeUser = async (targetUserId) => {
    if (!selectedUserForExchange) return;
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/exchange`, {
        userAId: selectedUserForExchange.userId,
        userBId: targetUserId
      });
      if (res.data.success) {
        setRooms(res.data.rooms);
        setSelectedUserForExchange(null);
      }
    } catch (err) {
      console.error('Error exchanging users:', err);
    }
  };

  // 10. Broadcast Message to All Rooms (18.13)
  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    if (socket) {
      socket.emit('breakout-broadcast-message', meetingId, {
        message: broadcastMessage.trim(),
        senderName: currentUser.name || 'Host',
        timestamp: new Date()
      });
    }
    setBroadcastMessage('');
    setShowBroadcastModal(false);
  };

  // 11. Share Screen to All Breakout Rooms (18.14)
  const handleToggleShareToAll = () => {
    const nextState = !isSharingToRooms;
    setIsSharingToRooms(nextState);
    if (socket) {
      socket.emit('breakout-broadcast-share', meetingId, {
        isSharing: nextState,
        sharerName: currentUser.name || 'Host'
      });
    }
  };

  // 12. Save Current Assignment (18.22)
  const handleSaveCurrentAssignment = async () => {
    if (!saveTitle.trim()) return;
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/save-assignment`, {
        title: saveTitle.trim(),
        createdBy: currentUser.id
      });
      if (res.data.success) {
        fetchSavedAssignments();
        setShowSaveDialog(false);
        setSaveTitle('');
      }
    } catch (err) {
      console.error('Error saving breakout assignment:', err);
    }
  };

  // 13. Resolve Help Request (18.15)
  const handleResolveHelp = async (requestId, targetRoom) => {
    try {
      await axios.put(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-h3md.onrender.com" : "http://localhost:5000")}/api/meetings/${meetingId}/breakout/help/${requestId}/resolve`);
      setRooms(prev => prev.map(r => ({
        ...r,
        helpRequests: r.helpRequests?.map(h => h.requestId === requestId ? { ...h, status: 'RESOLVED' } : h)
      })));
      if (targetRoom) {
        onJoinBreakoutRoom(targetRoom);
        onClose();
      }
    } catch (err) {
      console.error('Error resolving help request:', err);
    }
  };

  if (!isOpen) return null;

  // Unassigned participants calculation
  const assignedUserIds = new Set();
  rooms.forEach(r => r.participants?.forEach(p => assignedUserIds.add(p.userId)));
  const unassignedParticipants = currentParticipants.filter(p => !assignedUserIds.has(p.userId || p.id));

  // Active rooms status
  const areRoomsOpen = rooms.some(r => r.status === 'OPEN' || r.status === 'CLOSING');
  const isClosing = rooms.some(r => r.status === 'CLOSING');

  // Help requests count
  const pendingHelpRequests = rooms.flatMap(r => (r.helpRequests || []).filter(h => h.status === 'PENDING').map(h => ({ ...h, room: r })));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans select-none">
      <div className="bg-[#1e232d] text-slate-100 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-base leading-tight">Breakout Rooms</h2>
              <span className="text-[11px] text-slate-400">
                {areRoomsOpen ? 'Rooms in session' : 'Manage smaller group sessions'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {viewState === 'MANAGE' && !areRoomsOpen && (
              <button
                onClick={() => setViewState('CREATE')}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-1"
                title="Recreate Rooms"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recreate</span>
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Urgent Help Requests Banner (18.15) */}
        {pendingHelpRequests.length > 0 && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200 animate-pulse">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>{pendingHelpRequests[0].userName}</strong> in <strong>{pendingHelpRequests[0].room.name}</strong> requested help!
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleResolveHelp(pendingHelpRequests[0].requestId, pendingHelpRequests[0].room)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1 rounded text-xs transition-colors shadow"
              >
                Join Room
              </button>
              <button
                onClick={() => handleResolveHelp(pendingHelpRequests[0].requestId, null)}
                className="text-amber-300 hover:text-white text-xs underline"
              >
                Later
              </button>
            </div>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {viewState === 'CREATE' ? (
            /* ============================================================ */
            /* 18.25 INTELLIMEET HOST CREATION UI                           */
            /* ============================================================ */
            <div className="space-y-5">
              {/* Number of Rooms Selector (18.2) */}
              <div className="flex items-center justify-between bg-slate-850/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="font-semibold text-sm text-slate-200">Number of Rooms</label>
                  <p className="text-xs text-slate-400 mt-0.5">Supports up to 100 breakout rooms</p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={roomCount}
                    onChange={(e) => setRoomCount(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500"
                  >
                    {[2, 3, 4, 5, 6, 8, 10, 15, 20, 25, 50, 100].map(n => (
                      <option key={n} value={n}>{n} Rooms</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignment Method Choices (18.2, 18.3, 18.4, 18.5, 18.6) */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Choose Assignment Method
                </span>

                <div className="space-y-2">
                  {[
                    { id: 'AUTOMATIC', title: 'Assign Automatically', desc: `Split ${currentParticipants.length} participant(s) evenly into ${roomCount} rooms` },
                    { id: 'MANUAL', title: 'Assign Manually', desc: 'Create empty rooms and choose participants for each room' },
                    { id: 'PARTICIPANT_CHOICE', title: 'Let Participants Choose Room', desc: 'Participants can select and join any room themselves' },
                    { id: 'LOAD_SAVED', title: 'Load Previous / Pre-assigned Assignment', desc: 'Restore room layouts saved from earlier meetings' }
                  ].map(m => (
                    <label
                      key={m.id}
                      onClick={() => setAssignmentMethod(m.id)}
                      className={`p-3.5 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                        assignmentMethod === m.id 
                          ? 'border-indigo-500 bg-indigo-500/10 text-slate-100 ring-1 ring-indigo-500' 
                          : 'border-slate-800 bg-slate-850/40 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="method"
                        checked={assignmentMethod === m.id}
                        onChange={() => setAssignmentMethod(m.id)}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500 bg-slate-850 border-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-sm text-slate-200">{m.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{m.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Load Saved Dropdown (if selected) */}
              {assignmentMethod === 'LOAD_SAVED' && (
                <div className="bg-slate-850/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Select Saved Assignment</label>
                  {savedAssignments.length === 0 ? (
                    <div className="text-xs text-slate-500">No saved assignments found for this meeting.</div>
                  ) : (
                    <select
                      value={selectedSavedId}
                      onChange={(e) => setSelectedSavedId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2 text-xs outline-none"
                    >
                      <option value="">-- Choose saved assignment --</option>
                      {savedAssignments.map(s => (
                        <option key={s.assignmentId} value={s.assignmentId}>
                          {s.title} ({s.rooms?.length} rooms)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Options Accordion (18.20) */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-850/40">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full p-3.5 text-left font-semibold text-xs flex items-center justify-between text-slate-300 hover:bg-slate-800/40"
                >
                  <span className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <span>Breakout Room Options & Permissions (18.20)</span>
                  </span>
                  {showSettings ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showSettings && (
                  <div className="p-4 border-t border-slate-800 space-y-3 text-xs text-slate-300 bg-slate-900/60">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allowSelfSelect}
                        onChange={(e) => setSettings({ ...settings, allowSelfSelect: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Allow participants to choose room</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allowReturnToMain}
                        onChange={(e) => setSettings({ ...settings, allowReturnToMain: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Allow participants to return to main session at any time</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoMoveParticipants}
                        onChange={(e) => setSettings({ ...settings, autoMoveParticipants: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Automatically move assigned participants into breakout rooms</span>
                    </label>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoClose}
                          onChange={(e) => setSettings({ ...settings, autoClose: e.target.checked })}
                          className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Automatically close rooms after:</span>
                      </label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={settings.durationMinutes}
                          onChange={(e) => setSettings({ ...settings, durationMinutes: Math.max(1, Number(e.target.value)) })}
                          className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-center text-slate-100"
                        />
                        <span className="text-slate-400">min</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Countdown before closing:</span>
                      <select
                        value={settings.countdownSeconds}
                        onChange={(e) => setSettings({ ...settings, countdownSeconds: Number(e.target.value) })}
                        className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
                      >
                        <option value={60}>60 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={15}>15 seconds</option>
                        <option value={0}>No countdown</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* 18.28 INTELLIMEET HOST MANAGEMENT & MONITORING UI            */
            /* ============================================================ */
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex items-center justify-between bg-slate-850 p-2.5 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${areRoomsOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="font-semibold text-slate-200">
                    {isClosing ? 'Closing in countdown' : areRoomsOpen ? 'Active Session' : 'Ready to Open'}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">{rooms.length} Rooms</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleAddRoom}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center space-x-1"
                    title="Add Room (18.21)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Room</span>
                  </button>

                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center space-x-1"
                    title="Broadcast Message (18.13)"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Broadcast</span>
                  </button>

                  <button
                    onClick={handleToggleShareToAll}
                    className={`p-1.5 rounded-lg flex items-center space-x-1 transition-colors ${
                      isSharingToRooms ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title="Share Screen to All Rooms (18.14)"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share to All</span>
                  </button>

                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center space-x-1"
                    title="Save Assignments (18.22)"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rooms List (18.12, 18.25) */}
              <div className="space-y-3">
                {rooms.map(room => (
                  <div key={room.roomId} className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden">
                    {/* Room Header */}
                    <div className="p-3 bg-slate-900/50 flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        {editingRoomId === room.roomId ? (
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              value={editNameText}
                              onChange={(e) => setEditNameText(e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white outline-none"
                              autoFocus
                            />
                            <button onClick={() => handleSaveRename(room.roomId)} className="p-1 text-emerald-400 hover:text-emerald-300">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-slate-100">{room.name}</span>
                            <button
                              onClick={() => {
                                setEditingRoomId(room.roomId);
                                setEditNameText(room.name);
                              }}
                              className="text-slate-500 hover:text-slate-300"
                              title="Rename Room (18.8)"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                          {room.participants?.length || 0}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {/* Assign to this room dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setShowAssignDropdown(showAssignDropdown === room.roomId ? null : room.roomId)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-slate-800"
                          >
                            Assign
                          </button>
                          {showAssignDropdown === room.roomId && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs">
                              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Available to assign:</div>
                              {unassignedParticipants.length === 0 ? (
                                <div className="text-[11px] text-slate-500 px-2 py-1">No unassigned users</div>
                              ) : (
                                unassignedParticipants.map(u => (
                                  <button
                                    key={u.id || u.userId}
                                    onClick={() => handleAssignUser(u.id || u.userId, u.name || u.userName, room.roomId)}
                                    className="w-full text-left px-2 py-1.5 hover:bg-slate-800 rounded text-slate-200"
                                  >
                                    + {u.name || u.userName}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* Join / Visit Room button (18.11) */}
                        {areRoomsOpen && (
                          <button
                            onClick={() => {
                              onJoinBreakoutRoom(room);
                              onClose();
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1 rounded font-medium transition-colors"
                          >
                            Join
                          </button>
                        )}

                        {/* Delete Room */}
                        {!areRoomsOpen && (
                          <button
                            onClick={() => handleDeleteRoom(room.roomId)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Delete Room (18.21)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Participant List in Room */}
                    <div className="p-2 space-y-1">
                      {room.participants?.length === 0 ? (
                        <div className="text-[11px] text-slate-500 px-2 py-1 italic">No participants assigned</div>
                      ) : (
                        room.participants?.map(part => (
                          <div
                            key={part.userId}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 text-xs text-slate-200 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full bg-slate-500" />
                              <span>{part.userName}</span>
                              {part.status === 'JOINED' && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                                  Joined
                                </span>
                              )}
                            </div>

                            {/* Participant Actions: Move To (18.7) & Exchange (18.7) */}
                            <div className="flex items-center space-x-2 text-[11px]">
                              {/* Move to another room */}
                              <select
                                value=""
                                onChange={(e) => handleAssignUser(part.userId, part.userName, e.target.value)}
                                className="bg-slate-800 text-slate-400 hover:text-slate-200 rounded px-1.5 py-0.5 border border-slate-700 outline-none"
                              >
                                <option value="" disabled>Move to...</option>
                                {rooms.filter(r => r.roomId !== room.roomId).map(r => (
                                  <option key={r.roomId} value={r.roomId}>{r.name}</option>
                                ))}
                              </select>

                              {/* Exchange with participant */}
                              {selectedUserForExchange?.userId === part.userId ? (
                                <button
                                  onClick={() => setSelectedUserForExchange(null)}
                                  className="text-amber-400 text-[10px] underline"
                                >
                                  Cancel Swap
                                </button>
                              ) : selectedUserForExchange ? (
                                <button
                                  onClick={() => handleExchangeUser(part.userId)}
                                  className="text-emerald-400 text-[10px] underline"
                                >
                                  Swap with {selectedUserForExchange.userName}
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedUserForExchange(part)}
                                  className="text-slate-500 hover:text-slate-300"
                                  title="Exchange with another participant (18.7)"
                                >
                                  Swap
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Unassigned Participants List */}
              {unassignedParticipants.length > 0 && (
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                  <div className="font-semibold text-slate-400 mb-1.5">
                    Unassigned Participants ({unassignedParticipants.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {unassignedParticipants.map(u => (
                      <span key={u.id || u.userId} className="bg-slate-800 text-slate-300 px-2 py-1 rounded-md text-[11px]">
                        {u.name || u.userName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl font-semibold transition-colors"
          >
            Close
          </button>

          {viewState === 'CREATE' ? (
            <button
              onClick={handleCreateRooms}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-1.5"
            >
              <span>Create Rooms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              {!areRoomsOpen ? (
                <button
                  onClick={handleOpenAllRooms}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-5 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
                >
                  <Users className="w-4 h-4" />
                  <span>Open All Rooms</span>
                </button>
              ) : isClosing ? (
                <button
                  onClick={handleEndRoomsNow}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-5 py-2 rounded-xl font-semibold shadow transition-all"
                >
                  End Rooms Now
                </button>
              ) : (
                <button
                  onClick={handleCloseAllRooms}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-5 py-2 rounded-xl font-semibold shadow transition-all"
                >
                  Close All Rooms
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BROADCAST MESSAGE MODAL (18.13) */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-100 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Broadcast Message to All Rooms</span>
              </h3>
              <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. 5 minutes remaining. Please wrap up discussions."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 outline-none resize-none h-24 focus:border-indigo-500"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast to All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE ASSIGNMENT DIALOG (18.22) */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-3">
            <h3 className="font-semibold text-sm text-slate-100">Save Breakout Room Layout</h3>
            <p className="text-xs text-slate-400">Save current rooms & participant assignments for recurring meetings.</p>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="e.g. Sprint Planning Pods"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setShowSaveDialog(false)} className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs">
                Cancel
              </button>
              <button onClick={handleSaveCurrentAssignment} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
