import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MousePointer, Pen, StickyNote, Square, Circle, Triangle, 
  Diamond, Star, ArrowRight, Type, Eraser, Undo2, Redo2, 
  Plus, Minus, RotateCcw, Share2, Download, MessageSquare, 
  Eye, EyeOff, Lock, Unlock, Grid, ChevronLeft, ChevronRight, 
  Trash2, X, Check, MoreVertical, Send, UserCheck, Shield, 
  HelpCircle, Settings, Copy, CheckCircle2, AlertCircle, Maximize2
} from 'lucide-react';
import axios from 'axios';

const STICKY_COLORS = {
  yellow: { bg: '#fef08a', border: '#eab308', text: '#713f12' },
  blue: { bg: '#bae6fd', border: '#0284c7', text: '#0c4a6e' },
  green: { bg: '#bbf7d0', border: '#16a34a', text: '#14532d' },
  pink: { bg: '#fbcfe8', border: '#db2777', text: '#831843' },
  purple: { bg: '#e9d5ff', border: '#9333ea', text: '#581c87' },
  orange: { bg: '#fed7aa', border: '#ea580c', text: '#7c2d12' }
};

const SHAPES = [
  { id: 'RECTANGLE', label: 'Rectangle', icon: Square },
  { id: 'CIRCLE', label: 'Circle', icon: Circle },
  { id: 'TRIANGLE', label: 'Triangle', icon: Triangle },
  { id: 'DIAMOND', label: 'Diamond', icon: Diamond },
  { id: 'STAR', label: 'Star', icon: Star }
];

export default function WhiteboardStudio({
  whiteboardId,
  initialWhiteboard = null,
  currentUser = { id: 'user_host_1', name: 'Host' },
  socket = null,
  roomId = null,
  onClose = () => {},
  isHost = true
}) {
  // Whiteboard metadata state
  const [board, setBoard] = useState(initialWhiteboard || {
    whiteboardId,
    title: 'Collaborative Whiteboard',
    isLocked: false,
    isStarred: false,
    accessMode: 'COLLABORATE',
    privateBrainstorming: false,
    pages: [{ pageNumber: 1, title: 'Page 1' }],
    activePage: 1,
    collaborators: []
  });

  // Canvas objects and comments
  const [objects, setObjects] = useState([]);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Active Tool state
  const [activeTool, setActiveTool] = useState('select'); // select, pen, sticky, shape, connector, text, eraser, comment
  const [selectedShape, setSelectedShape] = useState('RECTANGLE');
  const [selectedStickyColor, setSelectedStickyColor] = useState('yellow');
  const [penColor, setPenColor] = useState('#6366f1');
  const [penWidth, setPenWidth] = useState(3);
  const [isPrivateSticky, setIsPrivateSticky] = useState(false);

  // Connector drawing state
  const [connectorStartObject, setConnectorStartObject] = useState(null);

  // Canvas Viewport (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);

  // Freehand drawing in-progress
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  // Selection & dragging objects
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [draggingObjectId, setDraggingObjectId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // UI Panels & Modals
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [activeCommentTab, setActiveCommentTab] = useState('ACTIVE'); // ACTIVE or RESOLVED
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteUserName, setInviteUserName] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');

  // Collaborators live cursors
  const [remoteCursors, setRemoteCursors] = useState({});

  const canvasRef = useRef(null);

  // Fetch whiteboard data on mount
  const fetchBoardData = useCallback(async () => {
    try {
      const res = await axios.get(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${whiteboardId}`);
      if (res.data.success) {
        setBoard(res.data.whiteboard);
        setObjects(res.data.objects || []);
        setComments(res.data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load whiteboard details:', err);
    }
  }, [whiteboardId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // Socket setup for real-time collaboration
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('whiteboard-open', roomId, {
      whiteboardId,
      user: currentUser
    });

    const handleObjectCreated = (newObj) => {
      setObjects(prev => [...prev.filter(o => o.objectId !== newObj.objectId), newObj]);
    };

    const handleObjectUpdated = (updatedObj) => {
      setObjects(prev => prev.map(o => o.objectId === updatedObj.objectId ? updatedObj : o));
    };

    const handleObjectDeleted = (delData) => {
      setObjects(prev => prev.filter(o => o.objectId !== delData.objectId));
    };

    const handleCommentAdded = (comm) => {
      setComments(prev => [...prev.filter(c => c.commentId !== comm.commentId), comm]);
    };

    const handleCommentReplied = (comm) => {
      setComments(prev => prev.map(c => c.commentId === comm.commentId ? comm : c));
    };

    const handleCommentResolved = (comm) => {
      setComments(prev => prev.map(c => c.commentId === comm.commentId ? comm : c));
    };

    const handleCursorMoved = (cursorData) => {
      if (cursorData.userId === currentUser.id) return;
      setRemoteCursors(prev => ({
        ...prev,
        [cursorData.userId]: cursorData
      }));
    };

    const handleSettingsUpdated = (updatedBoard) => {
      setBoard(updatedBoard);
    };

    socket.on('whiteboard-object-created', handleObjectCreated);
    socket.on('whiteboard-object-updated', handleObjectUpdated);
    socket.on('whiteboard-object-deleted', handleObjectDeleted);
    socket.on('whiteboard-comment-added', handleCommentAdded);
    socket.on('whiteboard-comment-replied', handleCommentReplied);
    socket.on('whiteboard-comment-resolved', handleCommentResolved);
    socket.on('whiteboard-cursor-moved', handleCursorMoved);
    socket.on('whiteboard-settings-updated', handleSettingsUpdated);

    return () => {
      socket.off('whiteboard-object-created', handleObjectCreated);
      socket.off('whiteboard-object-updated', handleObjectUpdated);
      socket.off('whiteboard-object-deleted', handleObjectDeleted);
      socket.off('whiteboard-comment-added', handleCommentAdded);
      socket.off('whiteboard-comment-replied', handleCommentReplied);
      socket.off('whiteboard-comment-resolved', handleCommentResolved);
      socket.off('whiteboard-cursor-moved', handleCursorMoved);
      socket.off('whiteboard-settings-updated', handleSettingsUpdated);
    };
  }, [socket, roomId, whiteboardId, currentUser]);

  // Determine user permission role (17.4, 17.19)
  const userRole = (() => {
    if (board.ownerId === currentUser.id || isHost) return 'owner';
    const collaborator = board.collaborators?.find(c => c.userId === currentUser.id);
    return collaborator?.role?.toLowerCase() || 'editor';
  })();

  const canEdit = !board.isLocked && (board.accessMode === 'COLLABORATE' || userRole === 'owner' || userRole === 'co-owner') && userRole !== 'viewer' && userRole !== 'commenter';
  const canComment = !board.isLocked && userRole !== 'viewer';
  const isOwnerOrCoOwner = userRole === 'owner' || userRole === 'co-owner';

  // Screen to Canvas coordinate translation
  const getCanvasCoords = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };

  // Broadcast cursor movement
  const handleMouseMove = (e) => {
    const coords = getCanvasCoords(e);
    if (socket && roomId) {
      socket.emit('whiteboard-cursor-move', roomId, {
        userId: currentUser.id,
        userName: currentUser.name,
        pageNumber: board.activePage,
        x: coords.x,
        y: coords.y
      });
    }

    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
      return;
    }

    if (isDrawing && activeTool === 'pen') {
      setCurrentStroke(prev => [...prev, { x: Math.round(coords.x), y: Math.round(coords.y) }]);
      return;
    }

    if (draggingObjectId) {
      const newX = Math.round(coords.x - dragOffset.x);
      const newY = Math.round(coords.y - dragOffset.y);
      setObjects(prev => prev.map(obj => 
        obj.objectId === draggingObjectId 
          ? { ...obj, position: { x: newX, y: newY } }
          : obj
      ));
    }
  };

  // Mouse Down handler
  const handleMouseDown = (e) => {
    // Middle click or spacebar enables pan
    if (e.button === 1 || e.spaceKey || activeTool === 'pan') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (!canEdit && activeTool !== 'comment' && activeTool !== 'select') return;

    const coords = getCanvasCoords(e);

    if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentStroke([{ x: Math.round(coords.x), y: Math.round(coords.y) }]);
    } else if (activeTool === 'sticky') {
      createStickyNote(coords.x, coords.y);
    } else if (activeTool === 'shape') {
      createShape(coords.x, coords.y, selectedShape);
    } else if (activeTool === 'text') {
      createText(coords.x, coords.y);
    } else if (activeTool === 'comment') {
      createCommentPin(coords.x, coords.y);
    } else if (activeTool === 'select') {
      // Check if clicking empty canvas to deselect
      if (e.target.tagName === 'svg' || e.target.classList.contains('canvas-background')) {
        setSelectedObjectId(null);
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  // Mouse Up handler
  const handleMouseUp = async () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isDrawing && currentStroke.length > 1) {
      setIsDrawing(false);
      await saveDrawingStroke(currentStroke);
      setCurrentStroke([]);
    }

    if (draggingObjectId) {
      const movedObj = objects.find(o => o.objectId === draggingObjectId);
      setDraggingObjectId(null);
      if (movedObj) {
        saveObjectUpdate(movedObj.objectId, { position: movedObj.position });
      }
    }
  };

  // Object Creation helpers
  const createStickyNote = async (x, y) => {
    const newSticky = {
      whiteboardId,
      pageNumber: board.activePage,
      type: 'STICKY_NOTE',
      content: 'New Note',
      position: { x: Math.round(x - 90), y: Math.round(y - 70) },
      size: { width: 180, height: 160 },
      style: {
        stickyColor: selectedStickyColor,
        isPrivate: isPrivateSticky
      },
      createdBy: { userId: currentUser.id, userName: currentUser.name }
    };
    await persistNewObject(newSticky);
    setActiveTool('select');
  };

  const createShape = async (x, y, shapeType) => {
    const newShape = {
      whiteboardId,
      pageNumber: board.activePage,
      type: 'SHAPE',
      content: shapeType,
      position: { x: Math.round(x - 80), y: Math.round(y - 50) },
      size: { width: 160, height: 100 },
      style: {
        shapeType,
        color: '#6366f1',
        fill: '#e0e7ff',
        strokeWidth: 2
      },
      createdBy: { userId: currentUser.id, userName: currentUser.name }
    };
    await persistNewObject(newShape);
    setActiveTool('select');
  };

  const createText = async (x, y) => {
    const newText = {
      whiteboardId,
      pageNumber: board.activePage,
      type: 'TEXT',
      content: 'Type text here...',
      position: { x: Math.round(x), y: Math.round(y) },
      size: { width: 200, height: 60 },
      style: {
        color: '#1e293b',
        fontSize: 18
      },
      createdBy: { userId: currentUser.id, userName: currentUser.name }
    };
    await persistNewObject(newText);
    setActiveTool('select');
  };

  const saveDrawingStroke = async (points) => {
    const newDrawing = {
      whiteboardId,
      pageNumber: board.activePage,
      type: 'DRAWING',
      points,
      style: {
        color: penColor,
        strokeWidth: penWidth
      },
      createdBy: { userId: currentUser.id, userName: currentUser.name }
    };
    await persistNewObject(newDrawing);
  };

  const persistNewObject = async (objData) => {
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${whiteboardId}/objects`, objData);
      if (res.data.success) {
        setObjects(prev => [...prev, res.data.object]);
        if (socket && roomId) {
          socket.emit('whiteboard-object-create', roomId, res.data.object);
        }
      }
    } catch (err) {
      console.error('Error creating object:', err);
    }
  };

  const saveObjectUpdate = async (objectId, updates) => {
    try {
      const res = await axios.put(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${whiteboardId}/objects/${objectId}`, updates);
      if (res.data.success) {
        if (socket && roomId) {
          socket.emit('whiteboard-object-update', roomId, res.data.object);
        }
      }
    } catch (err) {
      console.error('Error updating object:', err);
    }
  };

  const deleteObject = async (objectId) => {
    try {
      const res = await axios.delete(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${whiteboardId}/objects/${objectId}`);
      if (res.data.success) {
        setObjects(prev => prev.filter(o => o.objectId !== objectId));
        if (socket && roomId) {
          socket.emit('whiteboard-object-delete', roomId, { objectId });
        }
      }
    } catch (err) {
      console.error('Error deleting object:', err);
    }
  };

  // Smart Connector Creation (17.7)
  const handleObjectClickForConnector = async (targetObj) => {
    if (activeTool !== 'connector') return;

    if (!connectorStartObject) {
      setConnectorStartObject(targetObj);
    } else {
      if (connectorStartObject.objectId === targetObj.objectId) {
        setConnectorStartObject(null);
        return;
      }
      // Create connector between start and end objects
      const newConnector = {
        whiteboardId,
        pageNumber: board.activePage,
        type: 'CONNECTOR',
        content: 'Data Flow',
        style: { color: '#6366f1', strokeWidth: 2 },
        connectorData: {
          fromObjectId: connectorStartObject.objectId,
          toObjectId: targetObj.objectId,
          label: 'Connects to',
          arrowEnd: true
        },
        createdBy: { userId: currentUser.id, userName: currentUser.name }
      };
      await persistNewObject(newConnector);
      setConnectorStartObject(null);
      setActiveTool('select');
    }
  };

  // Comment Creation (17.8)
  const createCommentPin = async (x, y) => {
    if (!canComment) return;
    const newComment = {
      pageNumber: board.activePage,
      position: { x: Math.round(x), y: Math.round(y) },
      userId: currentUser.id,
      userName: currentUser.name,
      content: 'New comment thread. Type feedback here...',
      mentions: []
    };
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${whiteboardId}/comments`, newComment);
      if (res.data.success) {
        setComments(prev => [...prev, res.data.comment]);
        setSelectedCommentId(res.data.comment.commentId);
        setShowCommentsPanel(true);
        if (socket && roomId) {
          socket.emit('whiteboard-comment-add', roomId, res.data.comment);
        }
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
    setActiveTool('select');
  };

  const handleAddReply = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${whiteboardId}/comments/${commentId}/reply`, {
        userId: currentUser.id,
        userName: currentUser.name,
        content: replyText
      });
      if (res.data.success) {
        setComments(prev => prev.map(c => c.commentId === commentId ? res.data.comment : c));
        setReplyText('');
        if (socket && roomId) {
          socket.emit('whiteboard-comment-reply', roomId, res.data.comment);
        }
      }
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleResolveComment = async (commentId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'RESOLVED' : 'ACTIVE';
    try {
      const res = await axios.put(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${whiteboardId}/comments/${commentId}/resolve`, {
        status: newStatus
      });
      if (res.data.success) {
        setComments(prev => prev.map(c => c.commentId === commentId ? res.data.comment : c));
        if (socket && roomId) {
          socket.emit('whiteboard-comment-resolve', roomId, res.data.comment);
        }
      }
    } catch (err) {
      console.error('Error resolving comment:', err);
    }
  };

  // Multi-page navigation (17.18)
  const handleAddPage = async () => {
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${whiteboardId}/pages`, {
        title: `Page ${board.pages.length + 1}`
      });
      if (res.data.success) {
        setBoard(res.data.whiteboard);
      }
    } catch (err) {
      console.error('Error adding page:', err);
    }
  };

  const handleSwitchPage = (pageNum) => {
    setBoard(prev => ({ ...prev, activePage: pageNum }));
    setSelectedObjectId(null);
  };

  // Toggle Whiteboard Settings (Lock, Star, Mode, Private Brainstorming)
  const updateSettings = async (updates) => {
    try {
      const res = await axios.put(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${whiteboardId}`, updates);
      if (res.data.success) {
        setBoard(res.data.whiteboard);
        if (socket && roomId) {
          socket.emit('whiteboard-settings-update', roomId, res.data.whiteboard);
        }
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  // Permissions Assignment (17.4, 17.19)
  const handleAssignPermission = async () => {
    if (!inviteUserId.trim()) return;
    try {
      const res = await axios.post(`${(typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "https://intellmeet-backend-rc32.onrender.com" : "http://localhost:5000")}/api/whiteboards/${whiteboardId}/permissions`, {
        userId: inviteUserId,
        userName: inviteUserName || inviteUserId,
        role: inviteRole
      });
      if (res.data.success) {
        setBoard(res.data.whiteboard);
        setInviteUserId('');
        setInviteUserName('');
      }
    } catch (err) {
      console.error('Error updating permissions:', err);
    }
  };

  // Export board as SVG / PNG (17.14)
  const handleExport = (format) => {
    if (format === 'SVG') {
      const svgElement = canvasRef.current?.querySelector('svg');
      if (!svgElement) return;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = svgUrl;
      link.download = `${board.title || 'whiteboard'}.svg`;
      link.click();
    } else if (format === 'JSON') {
      const exportData = JSON.stringify({ board, objects, comments }, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${board.title || 'whiteboard'}.json`;
      link.click();
    }
  };

  // Filter objects for current page
  const pageObjects = objects.filter(o => (o.pageNumber || 1) === board.activePage);
  const pageComments = comments.filter(c => (c.pageNumber || 1) === board.activePage);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 select-none overflow-hidden font-sans text-slate-100">
      {/* 1. TOP HEADER TOOLBAR */}
      <header className="h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center space-x-3">
          {/* Title edit */}
          <input
            type="text"
            value={board.title}
            disabled={!isOwnerOrCoOwner}
            onChange={(e) => setBoard(prev => ({ ...prev, title: e.target.value }))}
            onBlur={() => updateSettings({ title: board.title })}
            className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 px-2 py-1 rounded font-semibold text-slate-100 border border-transparent focus:border-indigo-500 transition-colors max-w-[240px] truncate outline-none"
          />

          {/* Star Button */}
          <button
            onClick={() => updateSettings({ isStarred: !board.isStarred })}
            className={`p-1.5 rounded-lg transition-colors ${board.isStarred ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'}`}
            title="Star Whiteboard"
          >
            <Star className={`w-4 h-4 ${board.isStarred ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Lock state */}
          {isOwnerOrCoOwner && (
            <button
              onClick={() => updateSettings({ isLocked: !board.isLocked })}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                board.isLocked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Lock whiteboard to prevent participant edits"
            >
              {board.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{board.isLocked ? 'Locked' : 'Unlocked'}</span>
            </button>
          )}

          {/* Access Mode Badge (Collaborating vs Presenting) */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              disabled={!isOwnerOrCoOwner}
              onClick={() => updateSettings({ accessMode: 'COLLABORATE' })}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                board.accessMode === 'COLLABORATE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Collaborating
            </button>
            <button
              disabled={!isOwnerOrCoOwner}
              onClick={() => updateSettings({ accessMode: 'PRESENT' })}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                board.accessMode === 'PRESENT' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Presenting
            </button>
          </div>

          {/* Private Brainstorming Mode (17.6) */}
          {isOwnerOrCoOwner && (
            <button
              onClick={() => updateSettings({ privateBrainstorming: !board.privateBrainstorming })}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                board.privateBrainstorming 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Private Brainstorming: Sticky notes stay private until revealed"
            >
              {board.privateBrainstorming ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>Private Brainstorming</span>
            </button>
          )}
        </div>

        {/* Center: Multi-page navigation (17.18) */}
        <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1 border border-slate-700 space-x-2">
          <button
            disabled={board.activePage <= 1}
            onClick={() => handleSwitchPage(board.activePage - 1)}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-slate-200">
            Page {board.activePage} of {board.pages?.length || 1}
          </span>
          <button
            disabled={board.activePage >= (board.pages?.length || 1)}
            onClick={() => handleSwitchPage(board.activePage + 1)}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {isOwnerOrCoOwner && (
            <button
              onClick={handleAddPage}
              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 ml-1"
              title="Add Page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg px-1.5 py-0.5 border border-slate-700 text-xs">
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="p-1 text-slate-400 hover:text-white">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-slate-300 font-mono">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="p-1 text-slate-400 hover:text-white">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1 text-slate-400 hover:text-white" title="Reset View">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-indigo-600/30 text-indigo-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Comments Panel Toggle */}
          <button
            onClick={() => setShowCommentsPanel(!showCommentsPanel)}
            className={`relative p-2 rounded-lg transition-colors ${showCommentsPanel ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            title="Comments & Mentions"
          >
            <MessageSquare className="w-4 h-4" />
            {pageComments.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {pageComments.length}
              </span>
            )}
          </button>

          {/* Share / Permissions Modal (17.4) */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Export Menu */}
          <div className="relative group">
            <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg" title="Export Whiteboard">
              <Download className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-50 py-1 text-xs">
              <button onClick={() => handleExport('SVG')} className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200">
                Export as SVG
              </button>
              <button onClick={() => handleExport('JSON')} className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200">
                Export as JSON
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg"
            title="Keyboard Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Close Studio */}
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-rose-600/80 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Close Whiteboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE WITH FLOATING TOOL PALETTE */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* LEFT FLOATING TOOL PALETTE (17.5) */}
        <aside className="absolute left-4 top-6 z-30 flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1">
          {/* Select Tool */}
          <button
            onClick={() => setActiveTool('select')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'select' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            title="Select & Move (V)"
          >
            <MousePointer className="w-5 h-5" />
          </button>

          {/* Pen / Draw Tool */}
          <div className="relative group">
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-2.5 rounded-xl transition-all ${activeTool === 'pen' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              title="Pen / Drawing (P)"
            >
              <Pen className="w-5 h-5" />
            </button>
            {activeTool === 'pen' && (
              <div className="absolute left-full top-0 ml-2 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-xl flex items-center space-x-2 z-50">
                {['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#ffffff'].map(c => (
                  <button
                    key={c}
                    onClick={() => setPenColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border-2 ${penColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                  />
                ))}
                <div className="w-px h-5 bg-slate-700" />
                {[2, 4, 8].map(w => (
                  <button
                    key={w}
                    onClick={() => setPenWidth(w)}
                    className={`px-1.5 py-0.5 rounded text-xs ${penWidth === w ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Notes (17.6) */}
          <div className="relative group">
            <button
              onClick={() => setActiveTool('sticky')}
              className={`p-2.5 rounded-xl transition-all ${activeTool === 'sticky' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              title="Sticky Note (S)"
            >
              <StickyNote className="w-5 h-5" />
            </button>
            {activeTool === 'sticky' && (
              <div className="absolute left-full top-0 ml-2 bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-xl flex flex-col space-y-2 z-50 min-w-[140px]">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Note Color</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(STICKY_COLORS).map(([name, conf]) => (
                    <button
                      key={name}
                      onClick={() => setSelectedStickyColor(name)}
                      style={{ backgroundColor: conf.bg }}
                      className={`w-7 h-7 rounded-lg border-2 shadow-sm ${selectedStickyColor === name ? 'border-indigo-600 scale-105' : 'border-slate-700'}`}
                      title={name}
                    />
                  ))}
                </div>
                {board.privateBrainstorming && (
                  <label className="flex items-center space-x-2 text-xs text-purple-300 pt-1 border-t border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivateSticky}
                      onChange={(e) => setIsPrivateSticky(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-purple-400"
                    />
                    <span>Private Note</span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Shapes Tool */}
          <div className="relative group">
            <button
              onClick={() => setActiveTool('shape')}
              className={`p-2.5 rounded-xl transition-all ${activeTool === 'shape' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              title="Shapes (R)"
            >
              <Square className="w-5 h-5" />
            </button>
            {activeTool === 'shape' && (
              <div className="absolute left-full top-0 ml-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-xl flex flex-col space-y-1 z-50">
                {SHAPES.map(s => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedShape(s.id)}
                      className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedShape === s.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Smart Connector Tool (17.7) */}
          <button
            onClick={() => {
              setActiveTool('connector');
              setConnectorStartObject(null);
            }}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'connector' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            title="Smart Connector (C): Connect two objects"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Text Tool */}
          <button
            onClick={() => setActiveTool('text')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'text' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            title="Text (T)"
          >
            <Type className="w-5 h-5" />
          </button>

          {/* Eraser Tool */}
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'eraser' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            title="Eraser (E)"
          >
            <Eraser className="w-5 h-5" />
          </button>

          {/* Comment Pin Tool (17.8) */}
          <button
            onClick={() => setActiveTool('comment')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'comment' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            title="Add Comment Pin (M)"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <div className="w-full h-px bg-slate-800 my-1" />

          {/* Delete selected object */}
          {selectedObjectId && (
            <button
              onClick={() => deleteObject(selectedObjectId)}
              className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
              title="Delete Selected Object (Del)"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </aside>

        {/* CONNECTOR HELPER BANNER */}
        {activeTool === 'connector' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg z-30 flex items-center space-x-2">
            <ArrowRight className="w-4 h-4 animate-pulse" />
            <span>
              {!connectorStartObject 
                ? 'Click on the START object (Sticky Note or Shape)' 
                : 'Now click on the TARGET object to connect'}
            </span>
            <button onClick={() => { setActiveTool('select'); setConnectorStartObject(null); }} className="ml-2 hover:bg-indigo-700 rounded-full p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 3. DIGITAL CANVAS (MIDDLE AREA) */}
        <div
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full cursor-crosshair relative overflow-hidden"
          style={{
            backgroundImage: showGrid 
              ? 'radial-gradient(circle, #334155 1.5px, transparent 1.5px)' 
              : 'none',
            backgroundSize: '24px 24px',
            backgroundColor: '#0f172a'
          }}
        >
          {/* Zoom & Pan Viewport Container */}
          <div
            className="absolute origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isPanning ? 'none' : 'transform 0.05s ease-out'
            }}
          >
            {/* SVG OVERLAY FOR DRAWINGS, CONNECTORS & SHAPES */}
            <svg
              className="overflow-visible pointer-events-none"
              style={{ width: '4000px', height: '4000px' }}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                </marker>
              </defs>

              {/* RENDER SMART CONNECTORS (17.7) */}
              {pageObjects.filter(o => o.type === 'CONNECTOR').map(conn => {
                const fromObj = objects.find(o => o.objectId === conn.connectorData?.fromObjectId);
                const toObj = objects.find(o => o.objectId === conn.connectorData?.toObjectId);
                if (!fromObj || !toObj) return null;

                const startX = fromObj.position.x + (fromObj.size?.width || 160) / 2;
                const startY = fromObj.position.y + (fromObj.size?.height || 100) / 2;
                const endX = toObj.position.x + (toObj.size?.width || 160) / 2;
                const endY = toObj.position.y + (toObj.size?.height || 100) / 2;

                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;

                return (
                  <g key={conn.objectId} className="pointer-events-auto cursor-pointer" onClick={() => activeTool === 'eraser' && deleteObject(conn.objectId)}>
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke={conn.style?.color || '#6366f1'}
                      strokeWidth={conn.style?.strokeWidth || 2}
                      strokeDasharray="4"
                      markerEnd="url(#arrow)"
                    />
                    {conn.connectorData?.label && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-40"
                          y="-10"
                          width="80"
                          height="20"
                          rx="4"
                          fill="#1e293b"
                          stroke="#475569"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="4"
                          fill="#94a3b8"
                          fontSize="11"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {conn.connectorData.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* RENDER SAVED DRAWINGS */}
              {pageObjects.filter(o => o.type === 'DRAWING').map(drw => {
                if (!drw.points || drw.points.length < 2) return null;
                const pathData = drw.points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                return (
                  <path
                    key={drw.objectId}
                    d={pathData}
                    fill="none"
                    stroke={drw.style?.color || '#6366f1'}
                    strokeWidth={drw.style?.strokeWidth || 3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => activeTool === 'eraser' && deleteObject(drw.objectId)}
                  />
                );
              })}

              {/* IN-PROGRESS DRAWING STROKE */}
              {isDrawing && currentStroke.length > 1 && (
                <path
                  d={currentStroke.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')}
                  fill="none"
                  stroke={penColor}
                  strokeWidth={penWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>

            {/* RENDER STICKY NOTES (17.6) */}
            {pageObjects.filter(o => o.type === 'STICKY_NOTE').map(sticky => {
              const colorConf = STICKY_COLORS[sticky.style?.stickyColor || 'yellow'] || STICKY_COLORS.yellow;
              const isMasked = board.privateBrainstorming && sticky.style?.isPrivate && sticky.createdBy?.userId !== currentUser.id;
              const isSelected = selectedObjectId === sticky.objectId;
              const isConnectorStart = connectorStartObject?.objectId === sticky.objectId;

              return (
                <div
                  key={sticky.objectId}
                  style={{
                    transform: `translate(${sticky.position.x}px, ${sticky.position.y}px)`,
                    width: `${sticky.size?.width || 180}px`,
                    height: `${sticky.size?.height || 160}px`,
                    backgroundColor: colorConf.bg,
                    borderColor: isConnectorStart ? '#4f46e5' : isSelected ? '#3b82f6' : colorConf.border,
                    color: colorConf.text
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'eraser') {
                      deleteObject(sticky.objectId);
                    } else if (activeTool === 'connector') {
                      handleObjectClickForConnector(sticky);
                    } else {
                      setSelectedObjectId(sticky.objectId);
                    }
                  }}
                  onMouseDown={(e) => {
                    if (activeTool === 'select') {
                      setDraggingObjectId(sticky.objectId);
                      const coords = getCanvasCoords(e);
                      setDragOffset({
                        x: coords.x - sticky.position.x,
                        y: coords.y - sticky.position.y
                      });
                    }
                  }}
                  className={`absolute rounded-xl shadow-lg border-2 p-3 flex flex-col justify-between cursor-move transition-shadow ${
                    isSelected ? 'ring-2 ring-indigo-500 shadow-indigo-500/20 shadow-xl' : ''
                  } ${isConnectorStart ? 'ring-4 ring-indigo-500 animate-pulse' : ''}`}
                >
                  {/* Note header & author */}
                  <div className="flex items-center justify-between text-[11px] font-medium opacity-70">
                    <span className="truncate">{sticky.createdBy?.userName || 'Note'}</span>
                    {sticky.style?.isPrivate && (
                      <span className="flex items-center text-purple-700 bg-purple-200/60 px-1 rounded text-[10px]">
                        <EyeOff className="w-3 h-3 mr-0.5" /> Private
                      </span>
                    )}
                  </div>

                  {/* Note content or masked blur */}
                  {isMasked ? (
                    <div className="flex-1 flex flex-col items-center justify-center filter blur-[2px] opacity-40">
                      <Lock className="w-5 h-5 mb-1" />
                      <span className="text-xs font-semibold">Hidden Note</span>
                    </div>
                  ) : (
                    <textarea
                      value={sticky.content}
                      disabled={!canEdit}
                      onChange={(e) => {
                        const val = e.target.value;
                        setObjects(prev => prev.map(o => o.objectId === sticky.objectId ? { ...o, content: val } : o));
                      }}
                      onBlur={() => saveObjectUpdate(sticky.objectId, { content: sticky.content })}
                      className="w-full flex-1 bg-transparent resize-none outline-none font-medium text-sm my-1 placeholder-black/30"
                      placeholder="Add thought..."
                    />
                  )}

                  {/* Bottom indicator */}
                  <div className="flex items-center justify-between text-[10px] opacity-50">
                    <span>IntellMeet</span>
                    <span>17.6</span>
                  </div>
                </div>
              );
            })}

            {/* RENDER SHAPES (17.5) */}
            {pageObjects.filter(o => o.type === 'SHAPE').map(shape => {
              const isSelected = selectedObjectId === shape.objectId;
              const isConnectorStart = connectorStartObject?.objectId === shape.objectId;
              const width = shape.size?.width || 160;
              const height = shape.size?.height || 100;

              return (
                <div
                  key={shape.objectId}
                  style={{
                    transform: `translate(${shape.position.x}px, ${shape.position.y}px)`,
                    width: `${width}px`,
                    height: `${height}px`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'eraser') {
                      deleteObject(shape.objectId);
                    } else if (activeTool === 'connector') {
                      handleObjectClickForConnector(shape);
                    } else {
                      setSelectedObjectId(shape.objectId);
                    }
                  }}
                  onMouseDown={(e) => {
                    if (activeTool === 'select') {
                      setDraggingObjectId(shape.objectId);
                      const coords = getCanvasCoords(e);
                      setDragOffset({
                        x: coords.x - shape.position.x,
                        y: coords.y - shape.position.y
                      });
                    }
                  }}
                  className={`absolute flex items-center justify-center cursor-move ${
                    isSelected ? 'ring-2 ring-indigo-500' : ''
                  } ${isConnectorStart ? 'ring-4 ring-indigo-500 animate-pulse' : ''}`}
                >
                  <svg width={width} height={height} className="absolute inset-0">
                    {shape.style?.shapeType === 'CIRCLE' && (
                      <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - 2} ry={height / 2 - 2} fill={shape.style?.fill || '#e0e7ff'} stroke={shape.style?.color || '#6366f1'} strokeWidth="2" />
                    )}
                    {shape.style?.shapeType === 'RECTANGLE' && (
                      <rect x="2" y="2" width={width - 4} height={height - 4} rx="8" fill={shape.style?.fill || '#e0e7ff'} stroke={shape.style?.color || '#6366f1'} strokeWidth="2" />
                    )}
                    {shape.style?.shapeType === 'TRIANGLE' && (
                      <polygon points={`${width / 2},2 ${width - 2},${height - 2} 2,${height - 2}`} fill={shape.style?.fill || '#e0e7ff'} stroke={shape.style?.color || '#6366f1'} strokeWidth="2" />
                    )}
                    {shape.style?.shapeType === 'DIAMOND' && (
                      <polygon points={`${width / 2},2 ${width - 2},${height / 2} ${width / 2},${height - 2} 2,${height / 2}`} fill={shape.style?.fill || '#e0e7ff'} stroke={shape.style?.color || '#6366f1'} strokeWidth="2" />
                    )}
                    {shape.style?.shapeType === 'STAR' && (
                      <polygon points={`${width*0.5},${height*0.05} ${width*0.62},${height*0.35} ${width*0.95},${height*0.38} ${width*0.7},${height*0.62} ${width*0.78},${height*0.95} ${width*0.5},${height*0.78} ${width*0.22},${height*0.95} ${width*0.3},${height*0.62} ${width*0.05},${height*0.38} ${width*0.38},${height*0.35}`} fill={shape.style?.fill || '#e0e7ff'} stroke={shape.style?.color || '#6366f1'} strokeWidth="2" />
                    )}
                  </svg>
                  <input
                    type="text"
                    value={shape.content}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const val = e.target.value;
                      setObjects(prev => prev.map(o => o.objectId === shape.objectId ? { ...o, content: val } : o));
                    }}
                    onBlur={() => saveObjectUpdate(shape.objectId, { content: shape.content })}
                    className="relative z-10 bg-transparent text-center font-semibold text-slate-800 outline-none w-3/4 text-sm"
                  />
                </div>
              );
            })}

            {/* RENDER TEXT BLOCKS (17.5) */}
            {pageObjects.filter(o => o.type === 'TEXT').map(textObj => {
              const isSelected = selectedObjectId === textObj.objectId;
              return (
                <div
                  key={textObj.objectId}
                  style={{
                    transform: `translate(${textObj.position.x}px, ${textObj.position.y}px)`,
                    width: `${textObj.size?.width || 200}px`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'eraser') {
                      deleteObject(textObj.objectId);
                    } else {
                      setSelectedObjectId(textObj.objectId);
                    }
                  }}
                  onMouseDown={(e) => {
                    if (activeTool === 'select') {
                      setDraggingObjectId(textObj.objectId);
                      const coords = getCanvasCoords(e);
                      setDragOffset({
                        x: coords.x - textObj.position.x,
                        y: coords.y - textObj.position.y
                      });
                    }
                  }}
                  className={`absolute p-2 cursor-move ${isSelected ? 'ring-1 ring-indigo-400 bg-slate-800/40 rounded' : ''}`}
                >
                  <textarea
                    value={textObj.content}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const val = e.target.value;
                      setObjects(prev => prev.map(o => o.objectId === textObj.objectId ? { ...o, content: val } : o));
                    }}
                    onBlur={() => saveObjectUpdate(textObj.objectId, { content: textObj.content })}
                    className="w-full bg-transparent resize-none outline-none font-sans font-medium text-slate-100 text-base"
                  />
                </div>
              );
            })}

            {/* RENDER COMMENT PINS (17.8) */}
            {pageComments.map(comm => (
              <button
                key={comm.commentId}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCommentId(comm.commentId);
                  setShowCommentsPanel(true);
                }}
                style={{
                  transform: `translate(${comm.position?.x || 100}px, ${comm.position?.y || 100}px)`
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg border-2 transition-transform hover:scale-110 z-20 ${
                  comm.status === 'RESOLVED' 
                    ? 'bg-emerald-500 border-white text-white' 
                    : 'bg-indigo-600 border-white text-white'
                }`}
                title={`Comment by ${comm.userName}`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            ))}

            {/* RENDER REMOTE COLLABORATORS LIVE CURSORS (17.10) */}
            {Object.values(remoteCursors).map(cur => (
              cur.pageNumber === board.activePage && (
                <div
                  key={cur.userId}
                  style={{
                    transform: `translate(${cur.x}px, ${cur.y}px)`,
                    transition: 'transform 0.08s linear'
                  }}
                  className="absolute pointer-events-none z-30 flex items-center space-x-1"
                >
                  <MousePointer className="w-4 h-4 text-indigo-400 fill-indigo-400 -rotate-45" />
                  <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium shadow">
                    {cur.userName}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* 4. COMMENTS & DISCUSSION DRAWER (17.8, 17.9) */}
        {showCommentsPanel && (
          <aside className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-40">
            {/* Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-sm text-slate-100">Comments & Discussions</h3>
              </div>
              <button onClick={() => setShowCommentsPanel(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Active vs Resolved filter */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs">
              <button
                onClick={() => setActiveCommentTab('ACTIVE')}
                className={`flex-1 py-2 font-medium text-center transition-colors ${
                  activeCommentTab === 'ACTIVE' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Active ({pageComments.filter(c => c.status !== 'RESOLVED').length})
              </button>
              <button
                onClick={() => setActiveCommentTab('RESOLVED')}
                className={`flex-1 py-2 font-medium text-center transition-colors ${
                  activeCommentTab === 'RESOLVED' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Resolved ({pageComments.filter(c => c.status === 'RESOLVED').length})
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {pageComments
                .filter(c => activeCommentTab === 'RESOLVED' ? c.status === 'RESOLVED' : c.status !== 'RESOLVED')
                .map(comm => (
                  <div
                    key={comm.commentId}
                    className={`p-3 rounded-xl border transition-all ${
                      selectedCommentId === comm.commentId ? 'bg-slate-800 border-indigo-500' : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-200">{comm.userName}</span>
                      <button
                        onClick={() => handleResolveComment(comm.commentId, comm.status)}
                        className={`text-[11px] px-2 py-0.5 rounded font-medium flex items-center space-x-1 transition-colors ${
                          comm.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{comm.status === 'RESOLVED' ? 'Reopen' : 'Resolve'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 mb-2 leading-relaxed">{comm.content}</p>

                    {/* Replies */}
                    {comm.replies?.length > 0 && (
                      <div className="border-t border-slate-700/60 pt-2 space-y-1.5 mt-2">
                        {comm.replies.map(rep => (
                          <div key={rep.replyId} className="bg-slate-900/60 p-2 rounded-lg text-xs">
                            <span className="font-semibold text-slate-300">{rep.userName}: </span>
                            <span className="text-slate-400">{rep.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input */}
                    <div className="flex items-center space-x-1.5 mt-2.5">
                      <input
                        type="text"
                        placeholder="Reply or @mention..."
                        value={selectedCommentId === comm.commentId ? replyText : ''}
                        onFocus={() => setSelectedCommentId(comm.commentId)}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddReply(comm.commentId)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleAddReply(comm.commentId)}
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </aside>
        )}

        {/* 5. SHARE & PERMISSIONS MODAL (17.4, 17.19) */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-base text-slate-100">Whiteboard Permissions</h3>
                </div>
                <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Invite Form */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Invite Collaborator</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="User Name or Email"
                    value={inviteUserName}
                    onChange={(e) => {
                      setInviteUserName(e.target.value);
                      setInviteUserId(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                    }}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  >
                    <option value="co-owner">Co-owner</option>
                    <option value="editor">Editor</option>
                    <option value="commenter">Commenter</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={handleAssignPermission}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Invite
                  </button>
                </div>
              </div>

              {/* Collaborators List */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-slate-400">Current Access</div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{board.ownerName || 'Host'}</div>
                      <div className="text-slate-400 text-[10px]">Board Creator</div>
                    </div>
                    <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-medium text-[11px]">
                      Owner
                    </span>
                  </div>

                  {board.collaborators?.map(collab => (
                    <div key={collab.userId} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">{collab.userName}</div>
                        <div className="text-slate-400 text-[10px]">{collab.userId}</div>
                      </div>
                      <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium text-[11px] capitalize">
                        {collab.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. KEYBOARD SHORTCUTS MODAL (17.20) */}
        {showShortcutsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-semibold text-base text-slate-100">Keyboard Shortcuts</h3>
                <button onClick={() => setShowShortcutsModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { key: 'V', desc: 'Select / Move tool' },
                  { key: 'P', desc: 'Pen / Freehand Draw' },
                  { key: 'S', desc: 'Sticky Note' },
                  { key: 'R', desc: 'Shapes' },
                  { key: 'C', desc: 'Smart Connector' },
                  { key: 'T', desc: 'Text box' },
                  { key: 'E', desc: 'Eraser' },
                  { key: 'M', desc: 'Comment pin' },
                  { key: 'Space + Drag', desc: 'Pan canvas' }
                ].map(sc => (
                  <div key={sc.key} className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">{sc.desc}</span>
                    <kbd className="bg-slate-800 text-indigo-400 px-2 py-0.5 rounded font-mono font-semibold border border-slate-700">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
