import React, { useRef, useState, useEffect } from 'react';
import { 
  X, Square, Circle, Minus, ArrowRight, Type, Download, Trash2, 
  RotateCcw, RotateCw, Edit2, Eraser, Check, Minimize2, Maximize2
} from 'lucide-react';

const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
];

const STROKE_WIDTHS = [2, 4, 8, 14];

export default function WhiteboardModal({
  isOpen,
  onClose,
  socket,
  meetingId,
  isSharer = true,
  sharerName = 'Participant'
}) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser' | 'rect' | 'circle' | 'line' | 'arrow' | 'text'
  const [color, setColor] = useState('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize and resize canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions to parent container
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    saveState();
  }, [isOpen]);

  // Listen to remote whiteboard draw events
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleRemoteDraw = (drawData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      ctx.save();
      ctx.strokeStyle = drawData.color;
      ctx.lineWidth = drawData.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (drawData.tool === 'pen' || drawData.tool === 'eraser') {
        if (drawData.tool === 'eraser') {
          ctx.strokeStyle = '#181818';
        }
        ctx.beginPath();
        ctx.moveTo(drawData.startX, drawData.startY);
        ctx.lineTo(drawData.endX, drawData.endY);
        ctx.stroke();
      } else if (drawData.tool === 'rect') {
        ctx.strokeRect(drawData.startX, drawData.startY, drawData.width, drawData.height);
      } else if (drawData.tool === 'circle') {
        ctx.beginPath();
        ctx.arc(drawData.startX, drawData.startY, drawData.radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (drawData.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(drawData.startX, drawData.startY);
        ctx.lineTo(drawData.endX, drawData.endY);
        ctx.stroke();
      }
      ctx.restore();
    };

    const handleRemoteClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#181818';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveState();
    };

    socket.on('whiteboard-draw', handleRemoteDraw);
    socket.on('whiteboard-clear', handleRemoteClear);

    return () => {
      socket.off('whiteboard-draw', handleRemoteDraw);
      socket.off('whiteboard-clear', handleRemoteClear);
    };
  }, [socket, isOpen]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), imgData]);
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(history[newIdx], 0, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(history[newIdx], 0, 0);
    }
  };

  const startDraw = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = canvas.getContext('2d');
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      if (socket) {
        socket.emit('whiteboard-draw', meetingId, {
          tool: 'pen',
          startX: startPos.x,
          startY: startPos.y,
          endX: currentX,
          endY: currentY,
          color,
          strokeWidth,
        });
      }
      setStartPos({ x: currentX, y: currentY });
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#181818';
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      if (socket) {
        socket.emit('whiteboard-draw', meetingId, {
          tool: 'eraser',
          startX: startPos.x,
          startY: startPos.y,
          endX: currentX,
          endY: currentY,
          strokeWidth: strokeWidth * 2,
        });
      }
      setStartPos({ x: currentX, y: currentY });
    } else {
      // Shapes preview: restore snapshot first
      if (snapshot) ctx.putImageData(snapshot, 0, 0);
      ctx.strokeStyle = color;

      if (tool === 'rect') {
        const width = currentX - startPos.x;
        const height = currentY - startPos.y;
        ctx.strokeRect(startPos.x, startPos.y, width, height);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(currentX - startPos.x, 2) + Math.pow(currentY - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
      }
    }
  };

  const endDraw = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (tool === 'rect') {
      const width = currentX - startPos.x;
      const height = currentY - startPos.y;
      socket?.emit('whiteboard-draw', meetingId, {
        tool: 'rect',
        startX: startPos.x,
        startY: startPos.y,
        width,
        height,
        color,
        strokeWidth,
      });
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(currentX - startPos.x, 2) + Math.pow(currentY - startPos.y, 2));
      socket?.emit('whiteboard-draw', meetingId, {
        tool: 'circle',
        startX: startPos.x,
        startY: startPos.y,
        radius,
        color,
        strokeWidth,
      });
    } else if (tool === 'line') {
      socket?.emit('whiteboard-draw', meetingId, {
        tool: 'line',
        startX: startPos.x,
        startY: startPos.y,
        endX: currentX,
        endY: currentY,
        color,
        strokeWidth,
      });
    }

    saveState();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    socket?.emit('whiteboard-clear', meetingId);
    saveState();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `IntellMeet-Whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="h-14 bg-[#1F1F1F] border-b border-[#333] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Edit2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">IntellMeet Whiteboard (Collaborative Canvas)</h3>
            <p className="text-[11px] text-gray-400">All participants can view and annotate simultaneously</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 bg-[#282828] hover:bg-[#333] text-gray-300 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Download Whiteboard Image (.png)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-[#282828] hover:bg-red-600/30 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
            title="Close Whiteboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-[#181818] overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          className="w-full h-full cursor-crosshair"
        />

        {/* Floating Whiteboard Control Palette (Section 13.8) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#222]/95 border border-[#3A3A3A] rounded-2xl shadow-2xl p-2 flex items-center gap-3 backdrop-blur-md">
          {/* Tools Group */}
          <div className="flex items-center gap-1 border-r border-[#333] pr-3">
            {[
              { id: 'pen', icon: Edit2, label: 'Pen' },
              { id: 'eraser', icon: Eraser, label: 'Eraser' },
              { id: 'rect', icon: Square, label: 'Rectangle' },
              { id: 'circle', icon: Circle, label: 'Circle' },
              { id: 'line', icon: Minus, label: 'Line' },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  className={`p-2 rounded-xl transition-all ${
                    tool === t.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={t.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Color Palette */}
          {tool !== 'eraser' && (
            <div className="flex items-center gap-1.5 border-r border-[#333] pr-3">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-5 h-5 rounded-full border border-black/40 transition-transform ${
                    color === c.value ? 'scale-125 ring-2 ring-purple-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1 border-r border-[#333] pr-3">
            {STROKE_WIDTHS.map(w => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  strokeWidth === w ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title={`Stroke ${w}px`}
              >
                <div 
                  className="rounded-full bg-current" 
                  style={{ width: `${Math.min(w, 8)}px`, height: `${Math.min(w, 8)}px` }} 
                />
              </button>
            ))}
          </div>

          {/* Undo / Redo & Clear */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5"
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
