import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import {
  MessageSquare, Send, Paperclip, Smile, Pin, FileText, Download,
  Search, Settings, Filter, Reply, Edit3, Trash2, Clock, Users,
  CheckCircle2, AlertCircle, X, ChevronDown, ExternalLink, Sparkles,
  Share2, Image as ImageIcon, RefreshCw, Lock
} from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '👏', '🎉', '🚀', '🔥', '🤔', '👀'];

export default function ContinuousMeetingChat({ meeting, meetingId, user, onOpenRoom }) {
  const [messages, setMessages] = useState([]);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [phaseStats, setPhaseStats] = useState({ total: 0, before: 0, during: 0, after: 0, filesCount: 0 });
  const [chatSettings, setChatSettings] = useState({
    enabled: true,
    beforeMeetingChat: true,
    duringMeetingChat: true,
    afterMeetingChat: true,
    whoCanChat: 'everyone',
    allowFileSharing: true,
    allowReplies: true,
    allowReactions: true,
    retentionDays: 0,
  });

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'BEFORE' | 'DURING' | 'AFTER' | 'FILES'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Input states
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Shared Files list
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const currentMeetingId = meetingId || meeting?.meetingId || meeting?._id;
  const isHost = user?.email && (user.email === meeting?.hostEmail || user?.name === meeting?.hostName || user?.role === 'Administrator');

  // Determine current active phase of meeting
  const currentMeetingPhase = meeting?.status === 'live'
    ? 'DURING'
    : (meeting?.status === 'completed' ? 'AFTER' : 'BEFORE');

  // Socket setup
  useEffect(() => {
    if (!currentMeetingId) return;

    const socketUrl =
      import.meta.env.VITE_API_URL ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? (typeof localStorage !== 'undefined' && localStorage.getItem('intellmeet_api_url')) || 'https://intellmeet-backend.onrender.com'
        : 'http://localhost:5000');
    socketRef.current = io(socketUrl);
    socketRef.current.emit('join-room', currentMeetingId, user?.id || 'guest', user?.name || 'User');

    socketRef.current.on('receive-chat-message', (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === newMsg._id || (m.id && m.id === newMsg.id))) return prev;
        return [...prev, newMsg];
      });
      setPhaseStats(prev => ({
        ...prev,
        total: prev.total + 1,
        [newMsg.phase?.toLowerCase() || 'during']: (prev[newMsg.phase?.toLowerCase() || 'during'] || 0) + 1,
        filesCount: (newMsg.fileUrl || newMsg.documentShare) ? prev.filesCount + 1 : prev.filesCount
      }));
    });

    socketRef.current.on('chat-message-edited', (editedMsg) => {
      setMessages(prev => prev.map(m => m._id === editedMsg._id ? editedMsg : m));
    });

    socketRef.current.on('chat-message-deleted', (deletedMsgId) => {
      setMessages(prev => prev.map(m => {
        if (m._id === deletedMsgId) {
          return { ...m, isDeleted: true, text: '[This message was deleted]', fileUrl: '', fileName: '' };
        }
        return m;
      }));
    });

    socketRef.current.on('update-pinned-chat', (pinned) => {
      setPinnedMessage(pinned);
    });

    socketRef.current.on('continuous-chat-settings-updated', (settings) => {
      setChatSettings(settings);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [currentMeetingId]);

  // Fetch messages
  const fetchMessages = async () => {
    if (!currentMeetingId) return;
    try {
      setLoading(true);
      const phaseParam = activeTab === 'ALL' || activeTab === 'FILES' ? 'all' : activeTab;
      const queryParams = new URLSearchParams({
        userId: user?.id || user?._id || '',
        phase: phaseParam,
        search: searchQuery,
      });

      const res = await fetch(`http://localhost:5000/api/meetings/${currentMeetingId}/messages?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        if (data.pinnedMessage) setPinnedMessage(data.pinnedMessage);
        if (data.phaseStats) setPhaseStats(data.phaseStats);
        if (data.continuousChatSettings) setChatSettings(data.continuousChatSettings);
      }
    } catch (err) {
      console.error('Failed to load continuous chat:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch shared files
  const fetchSharedFiles = async () => {
    if (!currentMeetingId) return;
    try {
      setLoadingFiles(true);
      const res = await fetch(`http://localhost:5000/api/meetings/${currentMeetingId}/chat-files`);
      const data = await res.json();
      if (data.success) {
        setSharedFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch shared files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'FILES') {
      fetchSharedFiles();
    } else {
      fetchMessages();
    }
  }, [currentMeetingId, activeTab, searchQuery]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachment) return;

    // Check permission
    if (currentMeetingPhase === 'BEFORE' && !chatSettings.beforeMeetingChat) {
      toast.error('Pre-meeting chat is disabled by the host.');
      return;
    }
    if (currentMeetingPhase === 'AFTER' && !chatSettings.afterMeetingChat) {
      toast.error('Post-meeting chat is disabled by the host.');
      return;
    }

    const payload = {
      meetingId: currentMeetingId,
      senderId: user?.id || user?._id || 'user_' + Date.now(),
      senderName: user?.name || 'Participant',
      senderEmail: user?.email || '',
      recipientId: 'everyone',
      recipientName: 'Everyone',
      isPrivate: false,
      text: inputText.trim(),
      fileUrl: attachment?.url || '',
      fileName: attachment?.name || '',
      fileType: attachment?.type || '',
      fileSize: attachment?.size || '',
      replyTo: replyingTo ? {
        messageId: replyingTo._id,
        senderName: replyingTo.senderName,
        text: replyingTo.text?.slice(0, 100) || replyingTo.fileName || '',
      } : undefined,
      phase: currentMeetingPhase,
    };

    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${currentMeetingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        if (socketRef.current) {
          socketRef.current.emit('send-chat-message', currentMeetingId, data.message);
        }
        setInputText('');
        setAttachment(null);
        setReplyingTo(null);
        toast.success(`Message posted to ${currentMeetingPhase.toLowerCase()} meeting chat!`);
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (err) {
      toast.error('Network error sending message');
    }
  };

  // Upload file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!chatSettings.allowFileSharing) {
      toast.error('File sharing is currently disabled by host.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File exceeds 25 MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      let fType = 'document';
      if (file.type.startsWith('image/')) fType = 'image';
      else if (file.type.includes('pdf')) fType = 'pdf';
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setAttachment({
        name: file.name,
        type: fType,
        size: sizeStr,
        url: reader.result,
      });
      toast.success(`Attached "${file.name}"`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Edit Message
  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${currentMeetingId}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m._id === messageId ? data.message : m));
        if (socketRef.current) socketRef.current.emit('edit-chat-message', currentMeetingId, data.message);
        setEditingMessage(null);
        setEditText('');
        toast.success('Message updated');
      }
    } catch (err) {
      toast.error('Failed to update message');
    }
  };

  // Delete Message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message for everyone in the continuous meeting chat?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${currentMeetingId}/messages/${messageId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => {
          if (m._id === messageId) {
            return { ...m, isDeleted: true, text: '[This message was deleted]', fileUrl: '', fileName: '' };
          }
          return m;
        }));
        if (socketRef.current) socketRef.current.emit('delete-chat-message', currentMeetingId, messageId);
        toast.success('Message deleted');
      }
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  // Pin / Unpin
  const handleTogglePin = async (messageId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${currentMeetingId}/messages/${messageId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinnedBy: user?.name || 'Host' })
      });
      const data = await res.json();
      if (data.success) {
        setPinnedMessage(data.pinnedMessage);
        if (socketRef.current) socketRef.current.emit('pin-chat-message', currentMeetingId, data.pinnedMessage);
        toast.success(data.pinnedMessage ? 'Message pinned to top' : 'Message unpinned');
      }
    } catch (err) {
      toast.error('Failed to update pin');
    }
  };

  // Emoji Reaction
  const handleAddReaction = async (messageId, emoji) => {
    setShowEmojiPickerFor(null);
    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${currentMeetingId}/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userName: user?.name || 'User' })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m._id === messageId ? data.message : m));
        if (socketRef.current) socketRef.current.emit('chat-reaction', currentMeetingId, { messageId, emoji });
      }
    } catch (err) {
      toast.error('Failed to react');
    }
  };

  // Save Continuous Chat Settings (Host / Admin)
  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/meetings/${currentMeetingId}/continuous-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ continuousChatSettings: chatSettings })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Continuous Chat settings updated');
        setShowSettingsModal(false);
        if (socketRef.current) socketRef.current.emit('update-continuous-chat-settings', currentMeetingId, chatSettings);
      }
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  // Helper for phase pill styling
  const renderPhaseBadge = (phase) => {
    switch (phase) {
      case 'BEFORE':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Pre-Meeting
          </span>
        );
      case 'DURING':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> In-Meeting
          </span>
        );
      case 'AFTER':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> Post-Meeting
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      
      {/* Top Banner & Phase Controls */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              Continuous Meeting Chat
              {renderPhaseBadge(currentMeetingPhase)}
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            One persistent conversation across the meeting lifecycle — discuss agendas before, interact during, and follow up after.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isHost && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-1.5 border border-gray-200 hover:bg-white text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Configure Pre/During/After chat permissions"
            >
              <Settings className="w-3.5 h-3.5 text-gray-500" />
              Chat Settings
            </button>
          )}

          <button
            onClick={() => {
              if (activeTab === 'FILES') fetchSharedFiles();
              else fetchMessages();
              toast.success('Chat refreshed');
            }}
            className="p-1.5 border border-gray-200 hover:bg-white text-gray-600 rounded-xl transition-colors"
            title="Refresh conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onOpenRoom && (
            <button
              onClick={onOpenRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
            >
              Join Live Meeting <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="px-5 py-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold">
          {[
            { id: 'ALL', label: 'All Discussion', count: phaseStats.total },
            { id: 'BEFORE', label: 'Pre-Meeting', count: phaseStats.before },
            { id: 'DURING', label: 'In-Meeting', count: phaseStats.during },
            { id: 'AFTER', label: 'Post-Meeting', count: phaseStats.after },
            { id: 'FILES', label: 'Shared Files & Links', count: phaseStats.filesCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        {activeTab !== 'FILES' && (
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat or speaker..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div className="px-5 py-2.5 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between text-xs text-amber-950">
          <div className="flex items-center gap-2 overflow-hidden">
            <Pin className="w-3.5 h-3.5 text-amber-600 rotate-45 shrink-0" />
            <span className="font-bold text-amber-900 text-[11px] shrink-0 uppercase tracking-wider">
              Pinned by {pinnedMessage.pinnedBy || 'Host'}:
            </span>
            <span className="truncate font-medium">{pinnedMessage.text || pinnedMessage.fileName}</span>
          </div>
          {isHost && (
            <button
              onClick={() => handleTogglePin(pinnedMessage._id)}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-900 shrink-0 ml-2"
            >
              Unpin
            </button>
          )}
        </div>
      )}

      {/* MAIN VIEW: SHARED FILES TAB */}
      {activeTab === 'FILES' ? (
        <div className="p-5 h-96 overflow-y-auto">
          {loadingFiles ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              Loading shared assets across meeting lifecycle...
            </div>
          ) : sharedFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <FileText className="w-10 h-10 text-gray-300 mb-2" />
              <p className="font-bold text-xs text-gray-700">No shared files or links yet</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-sm">
                Any documents, mockups, or attachments shared before, during, or after the meeting are cataloged here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sharedFiles.map((f, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      {f.fileType === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs text-gray-900 truncate">{f.fileName}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                        <span>{f.senderName}</span>
                        <span>•</span>
                        {renderPhaseBadge(f.phase)}
                      </div>
                    </div>
                  </div>
                  {f.fileUrl && (
                    <a
                      href={f.fileUrl}
                      download={f.fileName}
                      className="px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MAIN VIEW: MESSAGES FEED */
        <div className="p-5 h-96 overflow-y-auto space-y-4 bg-gray-50/40">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              Loading continuous discussion...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-2 stroke-[1.5]" />
              <p className="font-bold text-xs text-gray-700">No messages in this view</p>
              <p className="text-[11px] text-gray-400 max-w-sm mt-1">
                Post an agenda point or question early. All messages are permanently saved and will be accessible across the entire meeting lifecycle!
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderName === (user?.name || 'You') || msg.senderEmail === user?.email;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showPhaseDivider = !prevMsg || prevMsg.phase !== msg.phase;

              return (
                <div key={msg._id || idx} className="space-y-3">
                  {/* Phase Separator Divider (Section 35.6 & 35.8) */}
                  {showPhaseDivider && activeTab === 'ALL' && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full shadow-xs">
                        {renderPhaseBadge(msg.phase)}
                        <span className="text-[10px] font-semibold text-gray-500">
                          {msg.phase === 'BEFORE' ? 'Pre-Meeting Discussion' :
                           msg.phase === 'DURING' ? 'Live In-Meeting Chat' :
                           'Post-Meeting Discussion'}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}

                  {/* Message Item */}
                  <div className={`group relative p-3 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-blue-50/60 border-blue-200 ml-6 md:ml-12'
                      : 'bg-white border-gray-200 mr-6 md:mr-12 shadow-xs'
                  }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-xs ${isMe ? 'text-blue-900' : 'text-gray-900'}`}>
                          {msg.senderName} {isMe && '(You)'}
                        </span>
                        {renderPhaseBadge(msg.phase)}
                        {msg.isPrivate && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            Direct Message
                          </span>
                        )}
                        {msg.isEdited && (
                          <span className="text-[9px] text-gray-400 italic">(edited)</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        
                        {/* Hover Action Menu */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1 bg-white border border-gray-200 rounded-lg px-1 py-0.5 shadow-xs">
                          {/* Reply */}
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                            title="Reply to message"
                          >
                            <Reply className="w-3 h-3" />
                          </button>

                          {/* React */}
                          <button
                            onClick={() => setShowEmojiPickerFor(showEmojiPickerFor === msg._id ? null : msg._id)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-amber-600"
                            title="Add reaction"
                          >
                            <Smile className="w-3 h-3" />
                          </button>

                          {/* Pin (Host only) */}
                          {isHost && (
                            <button
                              onClick={() => handleTogglePin(msg._id)}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-amber-600"
                              title="Pin message"
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                          )}

                          {/* Edit (Author only) */}
                          {isMe && !msg.isDeleted && (
                            <button
                              onClick={() => {
                                setEditingMessage(msg._id);
                                setEditText(msg.text);
                              }}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                              title="Edit message"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}

                          {/* Delete (Author or Host) */}
                          {(isMe || isHost) && !msg.isDeleted && (
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-rose-600"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reply Preview Quote */}
                    {msg.replyTo && (
                      <div className="mb-2 p-2 bg-gray-100/70 border-l-2 border-blue-500 rounded text-[11px] text-gray-600 flex items-center gap-1.5">
                        <Reply className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="font-semibold text-gray-700">{msg.replyTo.senderName}:</span>
                        <span className="truncate italic">{msg.replyTo.text}</span>
                      </div>
                    )}

                    {/* Message Body or Inline Editor */}
                    {editingMessage === msg._id ? (
                      <div className="mt-1 space-y-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white border border-blue-400 rounded-xl px-3 py-1.5 text-xs outline-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingMessage(null)}
                            className="px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg._id)}
                            className="px-3 py-1 text-[11px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Save Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.isDeleted ? 'text-gray-400 italic' : 'text-gray-800'
                      }`}>
                        {msg.text}
                      </p>
                    )}

                    {/* File Attachment */}
                    {msg.fileName && !msg.isDeleted && (
                      <div className="mt-2.5 p-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-semibold text-gray-800 truncate">{msg.fileName}</span>
                          <span className="text-gray-400 text-[10px]">({msg.fileSize || 'Attachment'})</span>
                        </div>
                        {msg.fileUrl && (
                          <a
                            href={msg.fileUrl}
                            download={msg.fileName}
                            className="px-2.5 py-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg font-bold text-[10px] flex items-center gap-1 shrink-0"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        )}
                      </div>
                    )}

                    {/* Document Collaboration Share */}
                    {msg.documentShare && !msg.isDeleted && (
                      <div className="mt-2.5 p-2 bg-blue-100/40 border border-blue-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-bold text-blue-900 text-xs">{msg.documentShare.docTitle}</p>
                            <p className="text-[10px] text-blue-600">Collaborative asset shared in meeting</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reactions Display */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {msg.reactions.map((r, rIdx) => (
                          <button
                            key={rIdx}
                            onClick={() => handleAddReaction(msg._id, r.emoji)}
                            className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs flex items-center gap-1 hover:bg-gray-50 transition-colors shadow-xs"
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[10px] font-bold text-gray-600">{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Emoji Reaction Quick Picker Popup */}
                    {showEmojiPickerFor === msg._id && (
                      <div className="absolute right-2 -top-9 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-lg flex items-center gap-1 z-20">
                        {COMMON_EMOJIS.map(em => (
                          <button
                            key={em}
                            onClick={() => handleAddReaction(msg._id, em)}
                            className="p-1 hover:bg-gray-100 rounded-lg text-sm transition-transform hover:scale-125"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Replying Banner */}
      {replyingTo && (
        <div className="px-5 py-2 bg-blue-50/80 border-t border-blue-200 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 overflow-hidden">
            <Reply className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-bold text-[11px] shrink-0">Replying to {replyingTo.senderName}:</span>
            <span className="truncate italic text-blue-700">{replyingTo.text || replyingTo.fileName}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-blue-500 hover:text-blue-800 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Attachment Preview Banner */}
      {attachment && (
        <div className="px-5 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-semibold truncate">{attachment.name}</span>
            <span className="text-[10px] text-gray-400">({attachment.size})</span>
          </div>
          <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
            title="Attach Document or Image (Section 35.13)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              currentMeetingPhase === 'BEFORE'
                ? "Post pre-meeting agenda, question, or note..."
                : currentMeetingPhase === 'AFTER'
                ? "Post post-meeting follow-up, action item, or note..."
                : "Type message in continuous meeting chat..."
            }
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
          />

          <button
            type="submit"
            disabled={!inputText.trim() && !attachment}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> Post
          </button>
        </form>
      </div>

      {/* HOST CHAT SETTINGS MODAL (Section 35.2, 35.10, 35.11) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                Continuous Meeting Chat Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div>
                  <p className="font-bold text-gray-900">Allow Chat Before & After Meeting</p>
                  <p className="text-[11px] text-gray-500">Zoom parity continuous chat enablement</p>
                </div>
                <input
                  type="checkbox"
                  checked={chatSettings.enabled}
                  onChange={(e) => setChatSettings({ ...chatSettings, enabled: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Granular Phase Switches */}
              <div className="space-y-3 pt-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Meeting Lifecycle Permissions
                </label>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Pre-Meeting Chat (Before call)</span>
                  <input
                    type="checkbox"
                    checked={chatSettings.beforeMeetingChat}
                    onChange={(e) => setChatSettings({ ...chatSettings, beforeMeetingChat: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Live In-Meeting Chat (During call)</span>
                  <input
                    type="checkbox"
                    checked={chatSettings.duringMeetingChat}
                    onChange={(e) => setChatSettings({ ...chatSettings, duringMeetingChat: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Post-Meeting Chat (After call)</span>
                  <input
                    type="checkbox"
                    checked={chatSettings.afterMeetingChat}
                    onChange={(e) => setChatSettings({ ...chatSettings, afterMeetingChat: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Security & Features */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Allow File & Document Sharing</span>
                  <input
                    type="checkbox"
                    checked={chatSettings.allowFileSharing}
                    onChange={(e) => setChatSettings({ ...chatSettings, allowFileSharing: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Chat Retention Policy (Section 35.20)</label>
                  <select
                    value={chatSettings.retentionDays}
                    onChange={(e) => setChatSettings({ ...chatSettings, retentionDays: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-semibold outline-none focus:border-blue-500"
                  >
                    <option value={0}>Keep Forever (Unlimited)</option>
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={365}>1 Year</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
