import React, { useState } from 'react';
import { 
  MousePointer, Move, Pen, Highlighter, Type, Square, Circle, 
  Minus, ArrowRight, Star, Check, X, Heart, Eraser, Palette, 
  Undo, Redo, Trash2, Download, Save, GripVertical, Sparkles, 
  ChevronDown, Eye, EyeOff
} from 'lucide-react';

export default function AnnotationToolbar({
  activeTool = 'draw',
  onSelectTool,
  color = '#EF4444',
  onChangeColor,
  lineWidth = 3,
  onChangeLineWidth,
  stampType = 'CHECK',
  onSelectStamp,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onClear,
  onSave,
  showAnnotatorNames = true,
  onToggleShowNames,
  isHostOrPresenter = false,
  onClose,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showStampMenu, setShowStampMenu] = useState(false);

  // Position state for floating dragging
  const [position, setPosition] = useState({ x: 40, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 750, e.clientX - dragOffset.x)),
      y: Math.max(10, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const COLORS = [
    { name: 'Red', hex: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#111827' }
  ];

  const LINE_WIDTHS = [
    { label: 'Fine', value: 2 },
    { label: 'Medium', value: 4 },
    { label: 'Bold', value: 8 }
  ];

  const STAMPS = [
    { id: 'CHECK', label: 'Check mark', icon: Check, symbol: '✓' },
    { id: 'STAR', label: 'Star', icon: Star, symbol: '★' },
    { id: 'CROSS', label: 'Cross', icon: X, symbol: '✕' },
    { id: 'HEART', label: 'Heart', icon: Heart, symbol: '❤️' }
  ];

  const isShapeActive = ['rect', 'circle', 'line'].includes(activeTool);

  return (
    <div 
      className="fixed z-50 select-none animate-in fade-in zoom-in-95 duration-150"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="bg-[#1C1D22]/95 backdrop-blur-md border border-[#3A3D4A] rounded-2xl shadow-2xl p-1.5 flex items-center gap-1 text-gray-200">
        
        {/* Drag Handle */}
        <div 
          onMouseDown={handleMouseDown}
          className="cursor-move p-1 text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center"
          title="Drag to reposition toolbar"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* 1. Mouse / Pointer (15.3.1) */}
        <button
          onClick={() => onSelectTool('mouse')}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
            activeTool === 'mouse' ? 'bg-blue-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
          }`}
          title="Mouse Pointer (Return to normal cursor)"
        >
          <MousePointer className="w-4 h-4" />
          <span className="text-[9px]">Mouse</span>
        </button>

        {/* 2. Select (15.3.2) */}
        <button
          onClick={() => onSelectTool('select')}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
            activeTool === 'select' ? 'bg-blue-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
          }`}
          title="Select & Move Annotations"
        >
          <Move className="w-4 h-4" />
          <span className="text-[9px]">Select</span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* 3. Draw / Pen (15.3.3) */}
        <button
          onClick={() => onSelectTool('draw')}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
            activeTool === 'draw' ? 'bg-blue-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
          }`}
          title="Draw Freehand Line"
        >
          <Pen className="w-4 h-4" />
          <span className="text-[9px]">Draw</span>
        </button>

        {/* 4. Highlight (15.3.4) */}
        <button
          onClick={() => onSelectTool('highlight')}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
            activeTool === 'highlight' ? 'bg-blue-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
          }`}
          title="Highlight Area (Semi-transparent)"
        >
          <Highlighter className="w-4 h-4" />
          <span className="text-[9px]">Highlight</span>
        </button>

        {/* 5. Text (15.3.5) */}
        <button
          onClick={() => onSelectTool('text')}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
            activeTool === 'text' ? 'bg-blue-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
          }`}
          title="Text Note (Click to type)"
        >
          <Type className="w-4 h-4" />
          <span className="text-[9px]">Text</span>
        </button>

        {/* 6. Arrow (15.3.9) */}
        <button
          onClick={() => onSelectTool('arrow')}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
            activeTool === 'arrow' ? 'bg-blue-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
          }`}
          title="Arrow (Points to items with your name)"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="text-[9px]">Arrow</span>
        </button>

        {/* 7. Shapes Dropdown (15.3.6) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowShapeMenu(!showShapeMenu);
              setShowColorPicker(false);
              setShowClearMenu(false);
              setShowSaveMenu(false);
              setShowStampMenu(false);
            }}
            className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
              isShapeActive ? 'bg-blue-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
            }`}
            title="Shapes (Rectangle, Circle, Line)"
          >
            <div className="flex items-center">
              {activeTool === 'circle' ? <Circle className="w-4 h-4" /> : activeTool === 'line' ? <Minus className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
            </div>
            <span className="text-[9px]">Shapes</span>
          </button>

          {showShapeMenu && (
            <div className="absolute top-full left-0 mt-2 bg-[#23242B] border border-[#3C3F4D] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 w-32 animate-in fade-in zoom-in-95">
              <button
                onClick={() => { onSelectTool('rect'); setShowShapeMenu(false); }}
                className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-white/10 ${activeTool === 'rect' ? 'text-blue-400 font-bold' : 'text-gray-300'}`}
              >
                <Square className="w-3.5 h-3.5" /> Rectangle
              </button>
              <button
                onClick={() => { onSelectTool('circle'); setShowShapeMenu(false); }}
                className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-white/10 ${activeTool === 'circle' ? 'text-blue-400 font-bold' : 'text-gray-300'}`}
              >
                <Circle className="w-3.5 h-3.5" /> Oval / Circle
              </button>
              <button
                onClick={() => { onSelectTool('line'); setShowShapeMenu(false); }}
                className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-white/10 ${activeTool === 'line' ? 'text-blue-400 font-bold' : 'text-gray-300'}`}
              >
                <Minus className="w-3.5 h-3.5" /> Straight Line
              </button>
            </div>
          )}
        </div>

        {/* 8. Stamp Dropdown (15.3.7) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowStampMenu(!showStampMenu);
              setShowColorPicker(false);
              setShowClearMenu(false);
              setShowSaveMenu(false);
              setShowShapeMenu(false);
            }}
            className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
              activeTool === 'stamp' ? 'bg-blue-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
            }`}
            title="Stamp (Check, Star, Cross, Heart)"
          >
            <div className="flex items-center">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
            </div>
            <span className="text-[9px]">Stamp</span>
          </button>

          {showStampMenu && (
            <div className="absolute top-full left-0 mt-2 bg-[#23242B] border border-[#3C3F4D] rounded-xl p-1.5 shadow-2xl z-50 flex items-center gap-1 animate-in fade-in zoom-in-95">
              {STAMPS.map(stamp => {
                const IconComponent = stamp.icon;
                return (
                  <button
                    key={stamp.id}
                    onClick={() => {
                      onSelectStamp(stamp.id);
                      onSelectTool('stamp');
                      setShowStampMenu(false);
                    }}
                    className={`p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center ${
                      stampType === stamp.id && activeTool === 'stamp' ? 'bg-blue-600 text-white' : 'text-gray-300'
                    }`}
                    title={stamp.label}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 9. Spotlight (15.3.8) */}
        <button
          onClick={() => onSelectTool('spotlight')}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
            activeTool === 'spotlight' ? 'bg-red-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
          }`}
          title="Spotlight Laser Pointer (Real-time cursor glow)"
        >
          <span className="w-4 h-4 rounded-full bg-red-500 animate-ping inline-block scale-75" />
          <span className="text-[9px]">Spotlight</span>
        </button>

        {/* 10. Vanishing Pen (15.3.10) */}
        <button
          onClick={() => onSelectTool('vanishing')}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
            activeTool === 'vanishing' ? 'bg-purple-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
          }`}
          title="Vanishing Pen (Disappears automatically after 3s)"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-[9px]">Vanishing</span>
        </button>

        {/* 11. Eraser (15.3.11) */}
        <button
          onClick={() => onSelectTool('eraser')}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-all ${
            activeTool === 'eraser' ? 'bg-amber-600 text-white font-bold shadow-lg' : 'hover:bg-white/10 text-gray-300'
          }`}
          title="Eraser (Click to delete annotation)"
        >
          <Eraser className="w-4 h-4" />
          <span className="text-[9px]">Eraser</span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* 12. Format / Color & Thickness (15.3.12) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowClearMenu(false);
              setShowSaveMenu(false);
              setShowShapeMenu(false);
              setShowStampMenu(false);
            }}
            className="p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 hover:bg-white/10 transition-colors"
            title="Format Color and Line Width"
          >
            <div className="w-4 h-4 rounded-full border-2 border-white shadow-inner" style={{ backgroundColor: color }} />
            <span className="text-[9px]">Format</span>
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#23242B] border border-[#3C3F4D] rounded-2xl p-3 shadow-2xl z-50 space-y-3 w-48 animate-in fade-in zoom-in-95">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Color</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLORS.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => { onChangeColor(c.hex); }}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform hover:scale-110 border ${
                        color === c.hex ? 'ring-2 ring-blue-500 scale-105 border-white' : 'border-white/10'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {color === c.hex && <Check className={`w-3.5 h-3.5 ${c.hex === '#FFFFFF' ? 'text-black' : 'text-white'}`} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Line Width</span>
                <div className="flex gap-1 bg-[#18191E] p-1 rounded-xl">
                  {LINE_WIDTHS.map(lw => (
                    <button
                      key={lw.value}
                      onClick={() => onChangeLineWidth(lw.value)}
                      className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition-colors ${
                        lineWidth === lw.value ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {lw.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 13. Undo & Redo (15.3.13) */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-colors ${
            canUndo ? 'hover:bg-white/10 text-gray-300' : 'opacity-40 cursor-not-allowed text-gray-500'
          }`}
          title="Undo latest change"
        >
          <Undo className="w-4 h-4" />
          <span className="text-[9px]">Undo</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-colors ${
            canRedo ? 'hover:bg-white/10 text-gray-300' : 'opacity-40 cursor-not-allowed text-gray-500'
          }`}
          title="Redo undone change"
        >
          <Redo className="w-4 h-4" />
          <span className="text-[9px]">Redo</span>
        </button>

        {/* 14. Clear Dropdown (15.3.14) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowClearMenu(!showClearMenu);
              setShowColorPicker(false);
              setShowSaveMenu(false);
              setShowShapeMenu(false);
              setShowStampMenu(false);
            }}
            className="p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 hover:bg-white/10 text-gray-300 transition-colors"
            title="Clear annotations"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className="text-[9px]">Clear</span>
          </button>

          {showClearMenu && (
            <div className="absolute top-full right-0 mt-2 bg-[#23242B] border border-[#3C3F4D] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 w-44 animate-in fade-in zoom-in-95 text-xs">
              {isHostOrPresenter && (
                <button
                  onClick={() => { onClear('all'); setShowClearMenu(false); }}
                  className="px-2.5 py-1.5 rounded-lg text-left text-red-400 hover:bg-red-500/20 font-semibold"
                >
                  Clear All Drawings
                </button>
              )}
              <button
                onClick={() => { onClear('mine'); setShowClearMenu(false); }}
                className="px-2.5 py-1.5 rounded-lg text-left text-gray-200 hover:bg-white/10"
              >
                Clear My Drawings
              </button>
              {isHostOrPresenter && (
                <button
                  onClick={() => { onClear('viewers'); setShowClearMenu(false); }}
                  className="px-2.5 py-1.5 rounded-lg text-left text-amber-400 hover:bg-amber-500/20"
                >
                  Clear Viewers' Drawings
                </button>
              )}
            </div>
          )}
        </div>

        {/* 15. Save Dropdown (15.3.15) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSaveMenu(!showSaveMenu);
              setShowColorPicker(false);
              setShowClearMenu(false);
              setShowShapeMenu(false);
              setShowStampMenu(false);
            }}
            className="p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 hover:bg-white/10 text-emerald-400 transition-colors"
            title="Save annotated screen"
          >
            <Download className="w-4 h-4" />
            <span className="text-[9px]">Save</span>
          </button>

          {showSaveMenu && (
            <div className="absolute top-full right-0 mt-2 bg-[#23242B] border border-[#3C3F4D] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 w-36 animate-in fade-in zoom-in-95 text-xs">
              <button
                onClick={() => { onSave('PNG'); setShowSaveMenu(false); }}
                className="px-2.5 py-1.5 rounded-lg text-left text-gray-200 hover:bg-white/10 flex items-center justify-between"
              >
                <span>Save as PNG</span>
                <span className="text-[10px] text-gray-400 font-mono">.png</span>
              </button>
              <button
                onClick={() => { onSave('PDF'); setShowSaveMenu(false); }}
                className="px-2.5 py-1.5 rounded-lg text-left text-gray-200 hover:bg-white/10 flex items-center justify-between"
              >
                <span>Save as PDF</span>
                <span className="text-[10px] text-gray-400 font-mono">.pdf</span>
              </button>
            </div>
          )}
        </div>

        {/* 16. Show Annotator Names Toggle (15.6) */}
        {isHostOrPresenter && (
          <button
            onClick={onToggleShowNames}
            className={`p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-colors ${
              showAnnotatorNames ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:bg-white/10'
            }`}
            title="Toggle showing names of annotators (Section 15.6)"
          >
            {showAnnotatorNames ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-[9px]">Names</span>
          </button>
        )}

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-xs flex flex-col items-center gap-0.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close Annotation Toolbar"
        >
          <X className="w-4 h-4" />
          <span className="text-[9px]">Close</span>
        </button>

      </div>
    </div>
  );
}
