import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export default function AnnotationCanvasOverlay({
  meetingId,
  user,
  isPresenter = false,
  isHostOrCoHost = false,
  activeTool = 'mouse',
  color = '#EF4444',
  lineWidth = 3,
  stampType = 'CHECK',
  showAnnotatorNames = true,
  socket,
  annotations = [],
  onAddAnnotation,
  onRemoveAnnotation,
  onClearAnnotations,
  containerRef,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [activeTextInput, setActiveTextInput] = useState(null); // { x, y, text }
  const [remoteSpotlights, setRemoteSpotlights] = useState({}); // userId -> { x, y, userName }
  const [vanishingStrokes, setVanishingStrokes] = useState([]); // [{ id, points, color, lineWidth, opacity, createdAt }]

  // Laser spotlight for local user
  const [localSpotlight, setLocalSpotlight] = useState(null);

  // Resize canvas to match container bounds
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawAll();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleRemoteStroke = (ann) => {
      if (ann.isVanishing) {
        setVanishingStrokes(prev => [...prev, { ...ann, opacity: 1, createdAt: Date.now() }]);
      } else {
        onAddAnnotation && onAddAnnotation(ann, false);
      }
    };

    const handleRemoteSpotlight = (data) => {
      setRemoteSpotlights(prev => ({
        ...prev,
        [data.userId]: { x: data.x, y: data.y, userName: data.userName }
      }));
    };

    const handleRemoteClear = (data) => {
      onClearAnnotations && onClearAnnotations(data.clearType, data.userId, false);
    };

    const handleRemoteUndo = (data) => {
      onRemoveAnnotation && onRemoveAnnotation(data.annotationId, false);
    };

    socket.on('annotation-stroke', handleRemoteStroke);
    socket.on('annotation-spotlight', handleRemoteSpotlight);
    socket.on('annotation-cleared', handleRemoteClear);
    socket.on('annotation-undone', handleRemoteUndo);

    return () => {
      socket.off('annotation-stroke', handleRemoteStroke);
      socket.off('annotation-spotlight', handleRemoteSpotlight);
      socket.off('annotation-cleared', handleRemoteClear);
      socket.off('annotation-undone', handleRemoteUndo);
    };
  }, [socket, onAddAnnotation, onRemoveAnnotation, onClearAnnotations]);

  // Vanishing pen fading animation loop
  useEffect(() => {
    if (vanishingStrokes.length === 0) return;

    let animId;
    const animateVanishing = () => {
      const now = Date.now();
      const updated = vanishingStrokes
        .map(s => {
          const age = now - s.createdAt;
          const opacity = Math.max(0, 1 - age / 2500); // Fades over 2.5s
          return { ...s, opacity };
        })
        .filter(s => s.opacity > 0);

      setVanishingStrokes(updated);
      redrawAll();

      if (updated.length > 0) {
        animId = requestAnimationFrame(animateVanishing);
      }
    };

    animId = requestAnimationFrame(animateVanishing);
    return () => cancelAnimationFrame(animId);
  }, [vanishingStrokes.length]);

  // Main canvas redraw engine
  const redrawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Render all persistent annotations
    annotations.forEach(ann => {
      if (ann.isDeleted) return;
      drawSingleAnnotation(ctx, ann);
    });

    // 2. Render vanishing strokes
    vanishingStrokes.forEach(v => {
      ctx.save();
      ctx.globalAlpha = v.opacity;
      drawSingleAnnotation(ctx, v);
      ctx.restore();
    });

    // 3. Render current live path being drawn
    if (currentPath.length > 1 && ['draw', 'highlight', 'vanishing'].includes(activeTool)) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (activeTool === 'highlight') {
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = lineWidth * 2.5;
      }

      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render shape preview while dragging
    if (isDrawing && startPoint && currentPath.length > 0 && ['rect', 'circle', 'line', 'arrow'].includes(activeTool)) {
      const cur = currentPath[currentPath.length - 1];
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.fillStyle = color + '22'; // 15% opacity fill
      ctx.setLineDash([4, 4]); // dashed preview

      if (activeTool === 'rect') {
        const x = Math.min(startPoint.x, cur.x);
        const y = Math.min(startPoint.y, cur.y);
        const w = Math.abs(cur.x - startPoint.x);
        const h = Math.abs(cur.y - startPoint.y);
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      } else if (activeTool === 'circle') {
        const rx = Math.abs(cur.x - startPoint.x) / 2;
        const ry = Math.abs(cur.y - startPoint.y) / 2;
        const cx = Math.min(startPoint.x, cur.x) + rx;
        const cy = Math.min(startPoint.y, cur.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(cur.x, cur.y);
        ctx.stroke();
      } else if (activeTool === 'arrow') {
        drawArrowVector(ctx, startPoint.x, startPoint.y, cur.x, cur.y, color, lineWidth, user?.name || 'You');
      }

      ctx.restore();
    }

    // 5. Render remote spotlights
    Object.entries(remoteSpotlights).forEach(([id, spot]) => {
      ctx.save();
      // Outer pulse
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 14, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fill();
      // Inner dot
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      // Tag
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(`🔴 ${spot.userName || 'Presenter'}`, spot.x + 12, spot.y + 4);
      ctx.restore();
    });

    // 6. Render local spotlight
    if (activeTool === 'spotlight' && localSpotlight) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(localSpotlight.x, localSpotlight.y, 16, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(localSpotlight.x, localSpotlight.y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.restore();
    }
  };

  // Helper to draw a single annotation
  const drawSingleAnnotation = (ctx, ann) => {
    ctx.save();
    ctx.strokeStyle = ann.color || '#EF4444';
    ctx.fillStyle = ann.color || '#EF4444';
    ctx.lineWidth = ann.lineWidth || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (ann.type) {
      case 'DRAW':
      case 'VANISHING':
        if (ann.points && ann.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'HIGHLIGHT':
        if (ann.points && ann.points.length > 1) {
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = (ann.lineWidth || 3) * 2.5;
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'RECTANGLE':
        if (ann.position && ann.dimensions) {
          ctx.fillStyle = ann.color + '18';
          ctx.fillRect(ann.position.x, ann.position.y, ann.dimensions.width, ann.dimensions.height);
          ctx.strokeRect(ann.position.x, ann.position.y, ann.dimensions.width, ann.dimensions.height);
          if (showAnnotatorNames && ann.userName) {
            renderNameBadge(ctx, ann.userName, ann.position.x, ann.position.y - 6);
          }
        }
        break;

      case 'CIRCLE':
        if (ann.position && ann.dimensions) {
          const rx = ann.dimensions.width / 2;
          const ry = ann.dimensions.height / 2;
          const cx = ann.position.x + rx;
          const cy = ann.position.y + ry;
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
          ctx.fillStyle = ann.color + '18';
          ctx.fill();
          ctx.stroke();
          if (showAnnotatorNames && ann.userName) {
            renderNameBadge(ctx, ann.userName, ann.position.x, ann.position.y - 6);
          }
        }
        break;

      case 'LINE':
        if (ann.position && ann.dimensions) {
          ctx.beginPath();
          ctx.moveTo(ann.position.x, ann.position.y);
          ctx.lineTo(ann.position.x + ann.dimensions.width, ann.position.y + ann.dimensions.height);
          ctx.stroke();
        }
        break;

      case 'ARROW':
        if (ann.position && ann.dimensions) {
          drawArrowVector(
            ctx,
            ann.position.x,
            ann.position.y,
            ann.position.x + ann.dimensions.width,
            ann.position.y + ann.dimensions.height,
            ann.color,
            ann.lineWidth,
            showAnnotatorNames ? ann.userName : null
          );
        }
        break;

      case 'STAMP':
        if (ann.position) {
          const symbols = { CHECK: '✓', STAR: '★', CROSS: '✕', HEART: '❤️' };
          const sym = symbols[ann.stampType] || '★';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText(sym, ann.position.x - 11, ann.position.y + 8);
          if (showAnnotatorNames && ann.userName) {
            renderNameBadge(ctx, ann.userName, ann.position.x + 14, ann.position.y + 4);
          }
        }
        break;

      case 'TEXT':
        if (ann.position && ann.text) {
          ctx.font = `${ann.fontSize || 16}px sans-serif`;
          ctx.fillStyle = ann.color || '#FFFFFF';
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 4;
          ctx.fillText(ann.text, ann.position.x, ann.position.y);
          if (showAnnotatorNames && ann.userName) {
            renderNameBadge(ctx, ann.userName, ann.position.x, ann.position.y - 20);
          }
        }
        break;

      default:
        break;
    }

    ctx.restore();
  };

  // Helper to draw Arrow vector with head and name
  const drawArrowVector = (ctx, fromX, fromY, toX, toY, arrowColor, width, userName) => {
    const headLength = 16;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = arrowColor;
    ctx.fillStyle = arrowColor;
    ctx.lineWidth = width;

    // Draw main line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Render annotator name tag (Section 15.6)
    if (userName) {
      renderNameBadge(ctx, `← ${userName}`, fromX - 6, fromY - 4);
    }

    ctx.restore();
  };

  // Helper to draw name badge beside annotations
  const renderNameBadge = (ctx, name, x, y) => {
    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    const textWidth = ctx.measureText(name).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(x - 3, y - 11, textWidth + 6, 14);
    ctx.fillStyle = '#60A5FA'; // light blue
    ctx.fillText(name, x, y);
    ctx.restore();
  };

  // Mouse event handlers
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    if (activeTool === 'mouse') return;
    const coords = getCanvasCoords(e);

    // Text tool: open input box at click point
    if (activeTool === 'text') {
      setActiveTextInput({ x: coords.x, y: coords.y, text: '' });
      return;
    }

    // Stamp tool: place immediately
    if (activeTool === 'stamp') {
      const ann = {
        annotationId: 'ann-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        meetingId,
        userId: user?.id || user?._id || 'local',
        userName: user?.name || 'You',
        userRole: isPresenter ? 'presenter' : isHostOrCoHost ? 'host' : 'participant',
        type: 'STAMP',
        stampType: stampType,
        position: coords,
        color,
        createdAt: new Date().toISOString()
      };
      onAddAnnotation && onAddAnnotation(ann, true);
      return;
    }

    // Eraser tool: delete clicked annotation
    if (activeTool === 'eraser') {
      deleteAnnotationAt(coords);
      return;
    }

    // Freehand drawing / shapes start
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentPath([coords]);
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoords(e);

    // Spotlight cursor tracking (broadcast to all)
    if (activeTool === 'spotlight') {
      setLocalSpotlight(coords);
      socket?.emit('annotation-spotlight', meetingId, {
        userId: user?.id || 'local',
        userName: user?.name || 'Presenter',
        x: coords.x,
        y: coords.y
      });
      redrawAll();
      return;
    }

    if (!isDrawing) return;

    if (['draw', 'highlight', 'vanishing'].includes(activeTool)) {
      setCurrentPath(prev => [...prev, coords]);
    } else if (['rect', 'circle', 'line', 'arrow'].includes(activeTool)) {
      setCurrentPath([coords]);
    }

    redrawAll();
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const coords = getCanvasCoords(e);

    const baseAnn = {
      annotationId: 'ann-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      meetingId,
      userId: user?.id || user?._id || 'local',
      userName: user?.name || 'You',
      userRole: isPresenter ? 'presenter' : isHostOrCoHost ? 'host' : 'participant',
      color,
      lineWidth,
      createdAt: new Date().toISOString()
    };

    if (['draw', 'highlight'].includes(activeTool)) {
      if (currentPath.length > 1) {
        const ann = {
          ...baseAnn,
          type: activeTool === 'highlight' ? 'HIGHLIGHT' : 'DRAW',
          points: currentPath
        };
        onAddAnnotation && onAddAnnotation(ann, true);
      }
    } else if (activeTool === 'vanishing') {
      if (currentPath.length > 1) {
        const ann = {
          ...baseAnn,
          type: 'VANISHING',
          points: currentPath,
          isVanishing: true,
          opacity: 1,
          createdAt: Date.now()
        };
        setVanishingStrokes(prev => [...prev, ann]);
        socket?.emit('annotation-stroke', meetingId, ann);
      }
    } else if (['rect', 'circle', 'line', 'arrow'].includes(activeTool) && startPoint) {
      const w = coords.x - startPoint.x;
      const h = coords.y - startPoint.y;
      if (Math.abs(w) > 4 || Math.abs(h) > 4) {
        const typeMap = {
          rect: 'RECTANGLE',
          circle: 'CIRCLE',
          line: 'LINE',
          arrow: 'ARROW'
        };
        const ann = {
          ...baseAnn,
          type: typeMap[activeTool],
          position: {
            x: activeTool === 'rect' ? Math.min(startPoint.x, coords.x) : startPoint.x,
            y: activeTool === 'rect' ? Math.min(startPoint.y, coords.y) : startPoint.y
          },
          dimensions: {
            width: activeTool === 'rect' ? Math.abs(w) : w,
            height: activeTool === 'rect' ? Math.abs(h) : h
          }
        };
        onAddAnnotation && onAddAnnotation(ann, true);
      }
    }

    setCurrentPath([]);
    setStartPoint(null);
  };

  // Eraser: Find and remove closest annotation
  const deleteAnnotationAt = (coords) => {
    const target = annotations.find(ann => {
      if (ann.isDeleted) return false;
      if (ann.points) {
        return ann.points.some(p => Math.hypot(p.x - coords.x, p.y - coords.y) < 16);
      }
      if (ann.position) {
        return Math.hypot(ann.position.x - coords.x, ann.position.y - coords.y) < 24;
      }
      return false;
    });

    if (target) {
      onRemoveAnnotation && onRemoveAnnotation(target.annotationId, true);
    }
  };

  // Commit text input
  const handleCommitText = () => {
    if (!activeTextInput || !activeTextInput.text.trim()) {
      setActiveTextInput(null);
      return;
    }

    const ann = {
      annotationId: 'ann-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      meetingId,
      userId: user?.id || user?._id || 'local',
      userName: user?.name || 'You',
      userRole: isPresenter ? 'presenter' : isHostOrCoHost ? 'host' : 'participant',
      type: 'TEXT',
      position: { x: activeTextInput.x, y: activeTextInput.y },
      text: activeTextInput.text,
      color,
      fontSize: 16,
      createdAt: new Date().toISOString()
    };

    onAddAnnotation && onAddAnnotation(ann, true);
    setActiveTextInput(null);
  };

  // Re-render when dependencies change
  useEffect(() => {
    redrawAll();
  }, [annotations, vanishingStrokes, showAnnotatorNames, remoteSpotlights, localSpotlight]);

  return (
    <div 
      className={`absolute inset-0 z-30 ${activeTool === 'mouse' ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'}`}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full block"
      />

      {/* Inline Text Input for Type Tool */}
      {activeTextInput && (
        <div
          className="absolute z-40 bg-black/80 p-1.5 rounded-xl border border-blue-500 shadow-2xl flex items-center gap-1.5"
          style={{ left: `${activeTextInput.x}px`, top: `${activeTextInput.y - 12}px` }}
        >
          <input
            type="text"
            autoFocus
            value={activeTextInput.text}
            onChange={(e) => setActiveTextInput(prev => ({ ...prev, text: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommitText();
              if (e.key === 'Escape') setActiveTextInput(null);
            }}
            placeholder="Type annotation note..."
            className="bg-transparent text-white text-xs outline-none px-1 py-0.5 border-b border-blue-400 w-48 font-medium"
            style={{ color }}
          />
          <button
            onClick={handleCommitText}
            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
