import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Pin, Sparkles, Mic, MicOff, MoreHorizontal, VideoOff, 
  Maximize2, Minimize2, Star, Check, Volume2, Shield, Users, 
  ChevronLeft, ChevronRight, RotateCcw, Share2, Grid, User,
  Layers, Move, Eye, EyeOff, LayoutGrid, Hand,
  Code, Globe, Presentation, Monitor, VolumeX, Terminal, Laptop
} from 'lucide-react';
import AnnotationCanvasOverlay from '../annotation/AnnotationCanvasOverlay';
import PresentationViewer from '../presentation/PresentationViewer';
import WatermarkOverlay from '../security/WatermarkOverlay';
import toast from 'react-hot-toast';

function RemoteParticipantTile({ participant, hasCamOn }) {
  const [remoteStream, setRemoteStream] = useState(participant.stream || null);

  useEffect(() => {
    if (participant.stream) {
      setRemoteStream(participant.stream);
    }
    const peer = participant.peer;
    if (!peer) return;

    if (peer._remoteStreams && peer._remoteStreams[0]) {
      setRemoteStream(peer._remoteStreams[0]);
    }

    const onStream = (stream) => {
      console.log('RemoteParticipantTile received remote stream:', stream.id, stream.getTracks());
      setRemoteStream(stream);
    };

    peer.on('stream', onStream);

    return () => {
      if (typeof peer.removeListener === 'function') {
        peer.removeListener('stream', onStream);
      }
    };
  }, [participant.peer, participant.stream]);

  const initials = (participant.name || 'Participant').slice(0, 2).toUpperCase();

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-black">
      {/* Hidden audio element always renders so participants can always hear each other */}
      <audio
        ref={(el) => {
          if (el && remoteStream && el.srcObject !== remoteStream) {
            el.srcObject = remoteStream;
            el.play().catch(e => console.warn('Remote audio play:', e));
          }
        }}
        autoPlay
        playsInline
      />

      {/* Video display when camera is active and stream is available */}
      {hasCamOn && remoteStream ? (
        <video
          ref={(el) => {
            if (el && remoteStream && el.srcObject !== remoteStream) {
              el.srcObject = remoteStream;
              el.play().catch(e => console.warn('Remote video play:', e));
            }
          }}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover relative z-10"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#2B2B2B] to-[#1C1C1C]">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${
            participant.isSpeaking ? 'bg-emerald-600 animate-pulse' : 'bg-purple-700'
          }`}>
            {initials}
          </div>
          <span className="mt-3 text-xs text-gray-300 font-medium">{participant.name}</span>
        </div>
      )}
    </div>
  );
}

export default function VideoLayoutEngine({
  layoutMode = 'gallery', // 'speaker' | 'gallery' | 'dynamic-gallery' | 'multi' | 'immersive' | 'floating' | 'side-by-side-speaker' | 'side-by-side-gallery'
  participants = [], // array of { id, name, isLocal, isMuted, isSpeaking, avatar, isHost, isCoHost, hasVideo }
  localStream,
  isVideoOn,
  isAudioOn,
  userVideoRef,
  isScreenSharing = false,
  screenTrack,
  pinnedParticipantIds = [], // Multi-pin support (Section 9.5: up to 9)
  onTogglePinParticipant,
  spotlightParticipantIds = [], // Multi-spotlight support (Section 9.6: up to 9)
  onToggleSpotlightParticipant,
  onClearAllSpotlights,
  hideNonVideoParticipants = false, // Section 9.13
  hideProfilePictures = false, // Section 30.6
  onToggleHideNonVideo,
  currentBackground = 'none',
  customBgUrl = '',
  currentFilter = 'none',
  currentAvatar = 'none',
  filterStyle = '',
  isHostOrCoHost = false,
  onMuteParticipant,
  onAskToUnmute,
  onHostBroadcastVideoOrder, // Section 9.4: Follow Host's Video Order
  screenShareSubMode = 'speaker', // 'speaker' | 'gallery'
  onSetScreenShareSubMode,
  raisedHands = [], // Part 12: List of participant IDs with hand raised
  nonVerbalFeedbacks = {}, // Part 12: participantId -> { value, label, icon }
  screenShareDetails = null, // Part 13: { isSharing, isPaused, sharerName, sourceName, type, videoPreviewUrl, documentName, presenterLayout }
  activeShareSessions = [], // Part 14: Multiple Screen Sharing sessions
  onHostStopParticipantShare, // Part 14: Host stops participant share (Section 14.10)
  // Part 15: Annotation Props (15.1 - 15.10)
  isAnnotating = false,
  annotationTool = 'draw',
  annotationColor = '#EF4444',
  annotationLineWidth = 3,
  annotationStampType = 'CHECK',
  showAnnotatorNames = true,
  annotations = [],
  onAddAnnotation,
  onRemoveAnnotation,
  onClearAnnotations,
  meetingId,
  user,
  socket,
  // Part 16: Slide Control Props (16.1 - 16.16)
  presentationSession = null,
  isPresenter = false,
  isSlideController = false,
  onNavigateSlide = () => {},
  onOpenSlideControlModal = () => {},
  onEndPresentation = () => {},
  // Part 32: Watermarking Props (32.1 - 32.7)
  watermarkSettings = {},
  viewerIdentity = {},
  // Part 37: Multi-Speaker Personalization (37.7)
  multiSpeakerCount = 2,
}) {
  const watermarkIdentityStr = 
    watermarkSettings?.identityType === 'maskedEmail'
      ? (viewerIdentity?.maskedEmail || 'us***@example.com')
      : watermarkSettings?.identityType === 'email'
        ? (viewerIdentity?.rawEmail || 'user@example.com')
        : (viewerIdentity?.participantId || 'USR-LOCAL');

  const [activeTileMenu, setActiveTileMenu] = useState(null);
  const [draggedTileIndex, setDraggedTileIndex] = useState(null);
  const [customOrder, setCustomOrder] = useState([]);
  const [hasCustomReorder, setHasCustomReorder] = useState(false);
  const [galleryPage, setGalleryPage] = useState(0);
  const PAGE_SIZE = 6; // Display 6 tiles per page for clear pagination demo

  // Part 14: Multiple Screen Sharing states (14.5, 14.11, 14.16)
  const [focusedShareId, setFocusedShareId] = useState(null);
  const [shareAudioMuted, setShareAudioMuted] = useState({});

  // Floating thumbnail position (Section 9.11)
  const [floatingPos, setFloatingPos] = useState({ x: 24, y: 24 });
  const [isDraggingFloating, setIsDraggingFloating] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });

  // Ensure local video element always stays synced with localStream and plays on camera ON
  useEffect(() => {
    const el = userVideoRef?.current;
    if (el && localStream) {
      if (el.srcObject !== localStream) {
        el.srcObject = localStream;
      }
      if (isVideoOn) {
        el.play().catch(e => console.warn('Local video play error on sync:', e));
      }
    }
  }, [localStream, isVideoOn, userVideoRef]);

  // 1. Filter out non-video participants if toggle is active (Section 9.13)
  const filteredParticipants = useMemo(() => {
    if (!hideNonVideoParticipants) return participants;
    return participants.filter(p => {
      if (p.isLocal) return isVideoOn;
      return p.hasVideo !== false;
    });
  }, [participants, hideNonVideoParticipants, isVideoOn]);

  // 2. Compute effective display order (respecting custom drag-and-drop order - Section 9.4)
  const orderedParticipants = useMemo(() => {
    if (customOrder.length > 0) {
      const orderMap = new Map();
      customOrder.forEach((id, idx) => orderMap.set(id, idx));
      return [...filteredParticipants].sort((a, b) => {
        const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : 999;
        const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : 999;
        return indexA - indexB;
      });
    }
    return filteredParticipants;
  }, [filteredParticipants, customOrder]);

  // 3. Drag-and-drop for Custom Gallery Order (Section 9.4)
  const handleDragStart = (e, index) => {
    setDraggedTileIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedTileIndex === null || draggedTileIndex === targetIndex) return;

    const newOrder = [...orderedParticipants.map(p => p.id)];
    const [movedId] = newOrder.splice(draggedTileIndex, 1);
    newOrder.splice(targetIndex, 0, movedId);
    setCustomOrder(newOrder);
    setHasCustomReorder(true);
    setDraggedTileIndex(null);
    toast.success('Custom gallery order saved');
  };

  const handleResetCustomOrder = () => {
    setCustomOrder([]);
    setHasCustomReorder(false);
    toast('Returned to default participant order');
  };

  // Helper to determine primary focal attendees (Spotlights take priority over Pins)
  const primaryParticipants = useMemo(() => {
    if (spotlightParticipantIds.length > 0) {
      return orderedParticipants.filter(p => spotlightParticipantIds.includes(p.id));
    }
    if (pinnedParticipantIds.length > 0) {
      return orderedParticipants.filter(p => pinnedParticipantIds.includes(p.id));
    }
    const speaker = orderedParticipants.find(p => p.isSpeaking);
    return speaker ? [speaker] : [orderedParticipants[0] || { id: 'local', name: 'You', isLocal: true }];
  }, [orderedParticipants, spotlightParticipantIds, pinnedParticipantIds]);

  // Helper renderer for a single participant video tile
  const renderParticipantTile = (p, isPrimary = false, isThumbnail = false, isDynamic = false) => {
    const isPinned = pinnedParticipantIds.includes(p.id);
    const isSpotlighted = spotlightParticipantIds.includes(p.id);
    const isLocal = p.isLocal;
    const hasCamOn = isLocal ? isVideoOn : p.hasVideo !== false;

    return (
      <div
        key={p.id}
        draggable={layoutMode.includes('gallery')}
        onDragStart={(e) => handleDragStart(e, orderedParticipants.findIndex(x => x.id === p.id))}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, orderedParticipants.findIndex(x => x.id === p.id))}
        className={`relative bg-[#202020] rounded-2xl overflow-hidden border transition-all duration-200 group flex items-center justify-center select-none shadow-xl ${
          p.isSpeaking ? 'border-emerald-500 ring-2 ring-emerald-500/50' : 'border-[#333]'
        } ${isSpotlighted ? 'ring-2 ring-amber-500 border-amber-500' : ''} ${
          isPinned && !isSpotlighted ? 'ring-2 ring-blue-500 border-blue-500' : ''
        } ${isThumbnail ? 'h-full aspect-video' : 'w-full h-full'} ${
          isDynamic ? 'aspect-[3/4] object-cover' : ''
        }`}
      >
        {/* Virtual Background Layer for Local User */}
        {isLocal && currentBackground !== 'none' && currentBackground !== 'blur' && (
          <img 
            src={currentBackground === 'custom' ? customBgUrl : currentBackground} 
            alt="Virtual Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}

        {/* Video feed, Avatar, or Inactive Camera Fallback */}
        {isLocal ? (
          currentAvatar !== 'none' ? (
            /* Local Avatar Persona (Section 8.7) */
            <div className="relative z-10 flex flex-col items-center justify-center p-4">
              <span className="text-6xl animate-bounce-short">
                {currentAvatar === 'fox' ? '🦊' : currentAvatar === 'cat' ? '🐱' : currentAvatar === 'panda' ? '🐼' : currentAvatar === 'robot' ? '🤖' : '🦉'}
              </span>
              <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded-full mt-2 font-semibold">Avatar Active</span>
            </div>
          ) : (
            <>
              <video
                ref={(el) => {
                  if (userVideoRef) {
                    if (typeof userVideoRef === 'function') userVideoRef(el);
                    else userVideoRef.current = el;
                  }
                  if (el) {
                    if (localStream && el.srcObject !== localStream) {
                      el.srcObject = localStream;
                    }
                    if (isVideoOn) {
                      el.play().catch(e => console.warn('Local video play error:', e));
                    }
                  }
                }}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover relative z-10 scale-x-[-1] ${isVideoOn ? 'block' : 'hidden'}`}
                style={{
                  filter: `${currentBackground === 'blur' ? 'blur(10px) ' : ''}${filterStyle}`
                }}
              />
              {!isVideoOn && (
                <div className="w-20 h-20 bg-purple-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </>
          )
        ) : (
          /* Remote Participant Live Video / Audio Tile */
          <RemoteParticipantTile participant={p} hasCamOn={hasCamOn} />
        )}

        {/* Badges: Pin, Spotlight, Hand Raised & Non-Verbal (Part 9 & Part 12) */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-20">
          {raisedHands.includes(p.id) && (
            <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md animate-pulse">
              <Hand className="w-3 h-3 fill-current" /> Hand
            </span>
          )}
          {nonVerbalFeedbacks[p.id] && (
            <span className="bg-blue-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
              <span>{nonVerbalFeedbacks[p.id].icon}</span>
              <span>{nonVerbalFeedbacks[p.id].label}</span>
            </span>
          )}
          {isSpotlighted && (
            <span className="bg-amber-500/95 text-black text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
              <Star className="w-3 h-3 fill-current" /> Spotlighted ({spotlightParticipantIds.indexOf(p.id) + 1})
            </span>
          )}
          {isPinned && !isSpotlighted && (
            <span className="bg-blue-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
              <Pin className="w-3 h-3 fill-current" /> Pinned ({pinnedParticipantIds.indexOf(p.id) + 1})
            </span>
          )}
        </div>

        {/* Hover Context Actions Menu (...) */}
        <div className="absolute top-2.5 right-2.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTileMenu(activeTileMenu === p.id ? null : p.id);
            }}
            className="p-1.5 bg-black/80 hover:bg-black text-white rounded-lg shadow-xl backdrop-blur-md"
            title="Tile Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Tile Dropdown Actions Menu */}
          {activeTileMenu === p.id && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#1C1C1C] border border-[#3A3A3A] rounded-2xl shadow-2xl py-1.5 text-xs text-gray-200 z-50 divide-y divide-[#2F2F2F] animate-in fade-in zoom-in-95 duration-100">
              
              {/* Personal Control: Pin / Remove Pin (Section 9.5 - Multi-pin up to 9) */}
              <div className="py-1">
                <button
                  onClick={() => {
                    onTogglePinParticipant(p.id);
                    setActiveTileMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center justify-between text-blue-400 font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Pin className="w-3.5 h-3.5" />
                    <span>{isPinned ? 'Remove Pin' : 'Pin Video (My View)'}</span>
                  </span>
                  <span className="text-[10px] text-gray-400">Max 9</span>
                </button>
              </div>

              {/* Host Control: Spotlight for Everyone (Section 9.6 - Multi-spotlight up to 9) */}
              {isHostOrCoHost && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      onToggleSpotlightParticipant(p.id);
                      setActiveTileMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center justify-between text-amber-400 font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{isSpotlighted ? 'Remove Spotlight' : 'Spotlight for Everyone'}</span>
                    </span>
                    <span className="text-[10px] text-gray-400">All</span>
                  </button>
                </div>
              )}

              {/* Participant Audio Controls */}
              {!isLocal && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      if (p.isMuted) onAskToUnmute(p.id, p.name);
                      else onMuteParticipant(p.id, p.name);
                      setActiveTileMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 flex items-center gap-2 text-gray-300"
                  >
                    {p.isMuted ? <Mic className="w-3.5 h-3.5 text-blue-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                    <span>{p.isMuted ? 'Ask to Unmute' : 'Mute'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Label Tag */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/60 px-2.5 py-1 rounded-md text-white text-xs font-medium backdrop-blur-sm flex items-center gap-2 z-20">
          <span>{p.name} {isLocal && '(Me)'}</span>
          {p.isMuted ? (
            <MicOff className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Mic className={`w-3.5 h-3.5 ${p.isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-gray-400'}`} />
          )}
        </div>

        {/* Part 32: Visual Watermark Overlay on Participant Video Tile (Disabled to prevent visual clutter) */}
        <WatermarkOverlay
          enabled={false}
          mode={watermarkSettings?.visualMode || 'repeated'}
          visibleOn={watermarkSettings?.visibleOn || 'both'}
          containerType="video"
          opacity={watermarkSettings?.opacity || 25}
          identity={watermarkIdentityStr}
          subtext="CONFIDENTIAL"
        />
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // LAYOUT 1: FLOATING THUMBNAIL (Section 9.11)
  // --------------------------------------------------------------------------
  if (layoutMode === 'floating') {
    const focusParticipant = primaryParticipants[0] || orderedParticipants[0];

    return (
      <div className="w-full h-full relative p-6 flex flex-col items-center justify-center bg-[#141414] overflow-hidden">
        {/* Main Content Area placeholder */}
        <div className="w-full max-w-4xl h-full flex flex-col items-center justify-center border-2 border-dashed border-[#333] rounded-3xl p-8 text-center text-gray-400">
          <Layers className="w-12 h-12 text-blue-500/40 mb-3" />
          <h3 className="text-base font-bold text-gray-200">Main Meeting Canvas Area</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Documents, whiteboards, or shared meeting resources can occupy the main area while video floats.
          </p>
        </div>

        {/* Movable Floating Picture-in-Picture Video Box */}
        <div 
          className="absolute z-50 w-72 h-44 shadow-2xl rounded-2xl overflow-hidden border-2 border-blue-500/60 cursor-move bg-black transition-shadow hover:shadow-blue-500/20"
          style={{ right: `${floatingPos.x}px`, bottom: `${floatingPos.y}px` }}
        >
          {focusParticipant && renderParticipantTile(focusParticipant, true, false)}
          <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-blue-400 font-bold backdrop-blur-sm flex items-center gap-1 z-30">
            <Move className="w-2.5 h-2.5" /> Floating Mini Window
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT 1.5: MULTIPLE SCREEN SHARING (Section 14.1 - 14.21)
  // Dual/Multi-Share Grid & Viewer Content Switching
  // --------------------------------------------------------------------------
  if (activeShareSessions && activeShareSessions.length > 1) {
    // Check if a specific share is currently focused by the viewer (Section 14.11)
    const focusedSession = focusedShareId 
      ? activeShareSessions.find(s => s.sharerId === focusedShareId || s.id === focusedShareId) || activeShareSessions[0]
      : null;

    // Helper for realistic application mock rendering
    const renderRealisticContent = (session) => {
      const src = (session?.sourceName || '').toLowerCase();
      const type = (session?.type || '').toUpperCase();

      if (src.includes('vs code') || src.includes('code') || src.includes('editor') || type === 'IDE') {
        return (
          <div className="w-full h-full bg-[#1E1E1E] text-gray-300 font-mono text-xs flex flex-col overflow-hidden select-none">
            {/* Editor Tab Bar */}
            <div className="flex items-center bg-[#252526] border-b border-[#333] px-2 text-[11px]">
              <div className="bg-[#1E1E1E] text-white px-3 py-1.5 border-t-2 border-blue-500 flex items-center gap-1.5 font-sans">
                <Code className="w-3 h-3 text-blue-400" />
                <span>MultiShareController.ts</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/70"></span>
              </div>
              <div className="px-3 py-1.5 text-gray-400 flex items-center gap-1.5 font-sans hover:text-white cursor-pointer">
                <span className="text-yellow-400">JS</span>
                <span>screenShareRoutes.js</span>
              </div>
              <div className="px-3 py-1.5 text-gray-400 flex items-center gap-1.5 font-sans hover:text-white cursor-pointer">
                <span className="text-purple-400">#</span>
                <span>intellmeet.css</span>
              </div>
            </div>
            {/* Code Content */}
            <div className="flex-1 p-3 overflow-hidden flex font-mono text-[11px] leading-relaxed">
              <div className="select-none text-gray-600 text-right pr-3 font-mono space-y-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <div className="text-gray-300 space-y-0.5 font-mono overflow-hidden">
                <div><span className="text-purple-400">import</span> &#123; <span className="text-sky-300">IntellMeetEngine</span> &#125; <span className="text-purple-400">from</span> <span className="text-amber-300">'@intellmeet/core'</span>;</div>
                <div><span className="text-purple-400">export async function</span> <span className="text-yellow-300">syncMultipleStreams</span>(roomId: <span className="text-emerald-300">string</span>) &#123;</div>
                <div className="pl-4"><span className="text-blue-400">const</span> activeStreams = <span className="text-purple-400">await</span> IntellMeetEngine.<span className="text-yellow-300">getStreams</span>(roomId);</div>
                <div className="pl-4"><span className="text-gray-500">// Dual/Multi hardware acceleration active</span></div>
                <div className="pl-4"><span className="text-purple-400">return</span> activeStreams.<span className="text-yellow-300">map</span>(stream =&gt; (&#123;</div>
                <div className="pl-8">sharerId: stream.participantId,</div>
                <div className="pl-8">resolution: <span className="text-amber-300">'1080p'</span>, fps: <span className="text-emerald-300">30</span></div>
                <div className="pl-4">&#125;));</div>
                <div>&#125;</div>
              </div>
            </div>
            {/* Terminal Strip */}
            <div className="bg-[#181818] border-t border-[#333] px-3 py-1 flex items-center justify-between text-[10px] text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓ bash</span>
                <span className="text-gray-500">|</span>
                <span>Multi-Screen Test Suite: PASS 21/21</span>
              </div>
              <div className="flex items-center gap-3">
                <span>TypeScript</span>
                <span>UTF-8</span>
                <span>Ln 8, Col 34</span>
              </div>
            </div>
          </div>
        );
      }

      if (src.includes('chrome') || src.includes('browser') || src.includes('web') || type === 'BROWSER') {
        return (
          <div className="w-full h-full bg-[#1A1A1A] flex flex-col overflow-hidden select-none">
            {/* Tab Bar */}
            <div className="flex items-center bg-[#202124] px-2 pt-1.5 gap-1 border-b border-[#303134]">
              <div className="bg-[#292A2D] text-white px-3 py-1 rounded-t-lg text-[11px] flex items-center gap-2 max-w-[200px]">
                <Globe className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">IntellMeet Analytics</span>
                <span className="text-gray-400 text-[10px]">✕</span>
              </div>
              <div className="text-gray-400 hover:text-white px-2 py-1 text-xs">+</div>
            </div>
            {/* URL Bar */}
            <div className="bg-[#292A2D] px-3 py-1.5 flex items-center gap-2 border-b border-[#383A3E] text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                <span>←</span>
                <span>→</span>
                <span>↻</span>
              </div>
              <div className="flex-1 bg-[#1A1A1A] rounded-full px-3 py-0.5 text-[11px] text-gray-300 flex items-center gap-1.5 border border-[#383A3E]">
                <span className="text-emerald-400">🔒</span>
                <span className="text-emerald-400 font-medium">https://</span>
                <span className="text-white">console.intellmeet.io/live/metrics</span>
              </div>
            </div>
            {/* Browser Page Body */}
            <div className="flex-1 p-4 bg-[#121316] text-white overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-200">Global Cluster Telemetry</h4>
                  <p className="text-[10px] text-gray-400">Real-time WebRTC Mesh Status</p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                  ● All Systems Live
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5 my-auto">
                <div className="bg-[#1C1E24] p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Active Sharers</span>
                  <span className="text-base font-bold text-blue-400">{activeShareSessions.length} Streams</span>
                </div>
                <div className="bg-[#1C1E24] p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Aggregate Bitrate</span>
                  <span className="text-base font-bold text-emerald-400">5.4 Mbps</span>
                </div>
                <div className="bg-[#1C1E24] p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Avg Latency</span>
                  <span className="text-base font-bold text-purple-400">22 ms</span>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 border-t border-white/5 pt-2 flex justify-between">
                <span>IntellMeet Cloud Infrastructure v2.4</span>
                <span>Hardware Acceleration: Enabled</span>
              </div>
            </div>
          </div>
        );
      }

      if (src.includes('powerpoint') || src.includes('slide') || src.includes('deck') || type === 'DOCUMENT') {
        return (
          <div className="w-full h-full bg-[#18191E] flex flex-col justify-between p-4 text-white overflow-hidden select-none">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold text-xs bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30">PPT</span>
                <span className="text-xs font-semibold">{session?.documentName || 'IntellMeet Q4 Strategic Plan'}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Slide 4 of 12</span>
            </div>
            <div className="my-auto text-center space-y-2 py-4">
              <div className="text-3xl">📊</div>
              <h3 className="text-base font-bold text-white">Simultaneous Multi-Screen Architecture</h3>
              <p className="text-xs text-gray-300 max-w-sm mx-auto">
                Independent sessions, dual-monitor viewport scaling, and host administrative termination parity.
              </p>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between text-[10px] text-gray-500">
              <span>Presented by {session.sharerName}</span>
              <span>Confidential • Internal</span>
            </div>
          </div>
        );
      }

      // Default Screen / Portion
      return (
        <div className="w-full h-full bg-[#0D0E12] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-2xl mb-2 shadow-lg">
            🖥️
          </div>
          <h4 className="text-xs font-bold text-white">{session?.sharerName}'s Screen</h4>
          <p className="text-[10px] text-gray-400 mt-1">{session?.sourceName || 'Entire Screen'}</p>
          <div className="mt-3 flex items-center gap-2 text-[10px] bg-black/60 px-3 py-1 rounded-full border border-white/10 text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>1080p • 30fps • Live Stream</span>
          </div>
        </div>
      );
    };

    // If viewer has focused on a specific screen (Viewer Content Switching - Section 14.11)
    if (focusedSession) {
      return (
        <div className="w-full h-full flex flex-col p-4 gap-3 select-none">
          {/* Top Multi-Share Navigation Switcher Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-2xl shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-white">
                Viewing {focusedSession.sharerName}'s Screen
              </span>
              <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-gray-300 border border-white/10">
                {focusedSession.sourceName}
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono border border-blue-500/30">
                Fit to Window (100%)
              </span>
            </div>

            {/* Quick Switch Buttons between All Active Sharers (Section 14.11) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFocusedShareId(null)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-700/60 hover:bg-gray-700 text-gray-200 hover:text-white flex items-center gap-1 transition-all"
                title="Return to Multi-Share Grid View"
              >
                <Grid className="w-3.5 h-3.5 text-blue-400" />
                <span>Grid View ({activeShareSessions.length})</span>
              </button>

              <div className="h-4 w-[1px] bg-white/10 mx-1"></div>

              {activeShareSessions.map((s) => (
                <button
                  key={s.sharerId}
                  onClick={() => setFocusedShareId(s.sharerId)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    focusedSession.sharerId === s.sharerId
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#333]'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>{s.sharerName}</span>
                </button>
              ))}

              {/* Host Stop Participant's Share (Section 14.10) */}
              {isHostOrCoHost && (
                <button
                  onClick={() => onHostStopParticipantShare && onHostStopParticipantShare(focusedSession.sharerId, focusedSession.sharerName)}
                  className="ml-2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600/80 hover:bg-red-600 text-white flex items-center gap-1 shadow-sm transition-all"
                  title="Host Control: Stop this participant's screen share"
                >
                  <VideoOff className="w-3 h-3" />
                  <span>Stop Share</span>
                </button>
              )}
            </div>
          </div>

          {/* Focused Canvas */}
          <div className="flex-1 bg-[#121212] rounded-2xl border border-[#333] shadow-2xl relative overflow-hidden flex flex-col">
            {renderRealisticContent(focusedSession)}

            {/* Part 15: Annotation Overlay on Focused Shared Screen */}
            {isAnnotating && (
              <AnnotationCanvasOverlay
                meetingId={meetingId}
                user={user}
                isPresenter={focusedSession.sharerId === (user?.id || 'local')}
                isHostOrCoHost={isHostOrCoHost}
                activeTool={annotationTool}
                color={annotationColor}
                lineWidth={annotationLineWidth}
                stampType={annotationStampType}
                showAnnotatorNames={showAnnotatorNames}
                socket={socket}
                annotations={annotations}
                onAddAnnotation={onAddAnnotation}
                onRemoveAnnotation={onRemoveAnnotation}
                onClearAnnotations={onClearAnnotations}
              />
            )}

            {/* Part 32: Visual Watermark Overlay on Focused Screen Share (Disabled to prevent visual clutter) */}
            <WatermarkOverlay
              enabled={false}
              mode={watermarkSettings?.visualMode || 'repeated'}
              visibleOn={watermarkSettings?.visibleOn || 'both'}
              containerType="sharedContent"
              opacity={watermarkSettings?.opacity || 25}
              identity={watermarkIdentityStr}
              subtext="CONFIDENTIAL"
            />
          </div>
        </div>
      );
    }

    // Otherwise, render Multi-Share Grid View (Section 14.5, 14.6, 14.12)
    return (
      <div className="w-full h-full flex flex-col p-4 gap-3 select-none">
        {/* Multi-Share Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-2xl shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white">
              Simultaneous Multi-Screen Sharing ({activeShareSessions.length} Active Screens)
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
              Dual/Multi-Stream Display
            </span>
          </div>
          <div className="text-[11px] text-gray-400 flex items-center gap-2">
            <span>Click any screen or "Focus" to view full size</span>
            <span className="bg-[#2A2A2A] text-gray-300 px-2 py-0.5 rounded text-[10px] font-mono border border-white/5">
              {activeShareSessions.length === 2 ? 'Side-by-Side (50/50)' : '2x2 Matrix Grid'}
            </span>
          </div>
        </div>

        {/* Multi-Share Grid Canvas (14.5, 14.12) */}
        <div className={`flex-1 grid gap-4 min-h-0 ${
          activeShareSessions.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'
        }`}>
          {activeShareSessions.map((session) => (
            <div
              key={session.sharerId}
              onClick={() => setFocusedShareId(session.sharerId)}
              className="bg-[#121212] rounded-2xl border border-[#333] hover:border-blue-500/60 shadow-2xl relative overflow-hidden flex flex-col group cursor-pointer transition-all duration-200"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#1B1B1F] border-b border-[#2C2C32] z-10" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 truncate">
                  <div className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center text-[10px] font-bold">
                    {session.sharerName?.charAt(0) || 'P'}
                  </div>
                  <span className="text-xs font-bold text-white truncate">
                    {session.sharerName}'s Screen
                  </span>
                  <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-gray-300 border border-white/10 font-sans">
                    {session.sourceName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Audio Status & Toggle (14.16) */}
                  {session.audioEnabled && (
                    <button
                      onClick={() => setShareAudioMuted(prev => ({ ...prev, [session.sharerId]: !prev[session.sharerId] }))}
                      className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      title={shareAudioMuted[session.sharerId] ? 'Audio Muted' : 'Sharing Audio'}
                    >
                      {shareAudioMuted[session.sharerId] ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                  )}

                  {/* Focus Button (14.11) */}
                  <button
                    onClick={() => setFocusedShareId(session.sharerId)}
                    className="bg-blue-600/80 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm"
                    title="Focus on this screen"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Focus</span>
                  </button>

                  {/* Host Stop Participant's Share (14.10) */}
                  {isHostOrCoHost && (
                    <button
                      onClick={() => onHostStopParticipantShare && onHostStopParticipantShare(session.sharerId, session.sharerName)}
                      className="bg-red-600/80 hover:bg-red-600 text-white px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm"
                      title="Host Control: Stop Participant's Share"
                    >
                      <VideoOff className="w-3 h-3" />
                      <span>Stop</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body: Realistic Visual Mock */}
              <div className="flex-1 relative overflow-hidden">
                {renderRealisticContent(session)}

                {/* Subtle Hover Overlay Hint */}
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 pointer-events-none transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs text-blue-300 border border-blue-400/30 shadow-xl font-medium">
                    Click to Focus View
                  </div>
                </div>
              </div>

              {/* Card Footer Strip */}
              <div className="px-3 py-1 bg-[#141416] border-t border-[#25252A] flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Live • 1080p 30fps
                </span>
                <span>Simultaneous Stream #{session.sharerId?.slice(-4) || '1'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT 2: SCREEN SHARING LAYOUTS (Side-by-Side, Overlay, Content-Only - Section 9.12 & 13.15)
  // --------------------------------------------------------------------------
  if (isScreenSharing) {
    const isPaused = screenShareDetails?.isPaused || false;
    const presenterLayout = screenShareDetails?.presenterLayout || 'side-by-side';
    const shareType = screenShareDetails?.type || 'SCREEN';
    const sourceName = screenShareDetails?.sourceName || 'Entire Screen';
    const sharerName = screenShareDetails?.sharerName || 'Presenter';

    return (
      <div className="w-full h-full flex flex-col p-4 gap-3">
        {/* Top Control Header for Screen Share Layout Switcher */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span className="text-xs font-bold text-white">
              {sharerName}'s Shared Screen — {sourceName}
            </span>
            <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-gray-400 border border-white/10">
              Layout: {presenterLayout === 'overlay' ? 'Presenter Overlay' : presenterLayout === 'content-only' ? 'Content Focus' : `Side-by-Side (${screenShareSubMode})`}
            </span>
          </div>

          {presenterLayout === 'side-by-side' && (
            <div className="flex items-center gap-1.5 bg-[#242424] p-1 rounded-xl border border-[#3A3A3A] text-xs">
              <button
                onClick={() => onSetScreenShareSubMode && onSetScreenShareSubMode('speaker')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  screenShareSubMode === 'speaker' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Side: Speaker
              </button>
              <button
                onClick={() => onSetScreenShareSubMode && onSetScreenShareSubMode('gallery')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  screenShareSubMode === 'gallery' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Side: Gallery
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex gap-4 min-h-0 relative">
          {/* Main Shared Screen Content Area */}
          <div className="flex-1 bg-[#121212] rounded-2xl border border-[#333] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
            {/* Top Bar on Shared Canvas */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>● Live Broadcast: {sourceName}</span>
              </div>
              {screenShareDetails?.videoOptimization && (
                <div className="bg-blue-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-semibold text-blue-300 border border-blue-500/30">
                  ⚡ Video Optimized (30fps)
                </div>
              )}
            </div>

            {/* Paused Overlay (Section 13.14) */}
            {isPaused && (
              <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl shadow-xl animate-pulse">
                  ⏸
                </div>
                <h3 className="text-lg font-bold text-white">Screen Sharing Paused</h3>
                <p className="text-xs text-gray-400">The presenter has temporarily paused screen sharing</p>
              </div>
            )}

            {/* Content Display based on Source Type */}
            {shareType === 'VIDEO' && screenShareDetails?.videoPreviewUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <video
                  src={screenShareDetails.videoPreviewUrl}
                  autoPlay
                  controls
                  loop
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (shareType === 'PRESENTATION' || (presentationSession && presentationSession.status === 'ACTIVE')) ? (
              <PresentationViewer
                session={presentationSession}
                isPresenter={isPresenter}
                isController={isSlideController}
                onNavigate={onNavigateSlide}
                onOpenSlideControlModal={onOpenSlideControlModal}
                onEndPresentation={onEndPresentation}
              />
            ) : shareType === 'DOCUMENT' ? (
              <div className="w-full h-full p-8 flex flex-col justify-between bg-gradient-to-br from-[#1E2028] via-[#16171D] to-[#0F1014] text-white">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <div>
                      <h4 className="text-base font-bold">{screenShareDetails?.documentName || 'Document Presentation'}</h4>
                      <p className="text-[11px] text-gray-400">Presented by {sharerName}</p>
                    </div>
                  </div>
                  <div className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full">
                    Slide 1 of 8
                  </div>
                </div>

                <div className="my-auto text-center space-y-4 max-w-lg mx-auto py-12">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-3xl shadow-inner">
                    📊
                  </div>
                  <h3 className="text-2xl font-bold text-white">IntellMeet Roadmap & Strategic Objectives</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Full parity architecture matching Zoom specifications: 13-tier Screen Sharing, Collaborative Whiteboard, and Real-Time Non-Verbal Feedback.
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 border-t border-white/10 pt-3">
                  <span>IntellMeet Presentation Deck</span>
                  <span>Confidential • Internal Demo</span>
                </div>
              </div>
            ) : shareType === 'PORTION' ? (
              <div className="w-full h-full relative flex items-center justify-center bg-[#0B0B0E]">
                <div className="w-3/4 h-3/4 border-2 border-dashed border-emerald-400 rounded-2xl bg-emerald-950/10 flex flex-col items-center justify-center text-center p-6 shadow-2xl relative">
                  <div className="absolute -top-3 left-4 bg-emerald-500 text-black font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                    PORTION SELECTION RECTANGLE (1280x720)
                  </div>
                  <Maximize2 className="w-10 h-10 text-emerald-400 mb-3 animate-pulse" />
                  <h4 className="text-base font-bold text-white">Sharing Selected Screen Portion</h4>
                  <p className="text-xs text-gray-400 max-w-sm mt-1">
                    Only contents inside this green rectangular window are visible to meeting participants.
                  </p>
                </div>
              </div>
            ) : (
              /* Default Screen / App Broadcast Frame */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-b from-[#181818] to-[#101010]">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-2xl">
                  <Maximize2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{sharerName} is sharing their {sourceName}</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                    Screen broadcast is live with crystal clear audio and presentation sync across all devices.
                  </p>
                </div>
              </div>
            )}

            {/* Presenter Overlay: Picture-in-Picture Webcam (Section 13.15) */}
            {presenterLayout === 'overlay' && (
              <div className="absolute bottom-4 right-4 z-20 w-56 h-36 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-2xl ring-4 ring-black/60 bg-[#222]">
                {renderParticipantTile(primaryParticipants[0] || orderedParticipants[0], true, false)}
                <div className="absolute top-1.5 left-2 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-white backdrop-blur-sm">
                  Presenter
                </div>
              </div>
            )}

            {/* Part 15: Annotation Canvas Overlay on Shared Screen */}
            {isAnnotating && (
              <AnnotationCanvasOverlay
                meetingId={meetingId}
                user={user}
                isPresenter={screenShareDetails?.sharerId === (user?.id || 'local')}
                isHostOrCoHost={isHostOrCoHost}
                activeTool={annotationTool}
                color={annotationColor}
                lineWidth={annotationLineWidth}
                stampType={annotationStampType}
                showAnnotatorNames={showAnnotatorNames}
                socket={socket}
                annotations={annotations}
                onAddAnnotation={onAddAnnotation}
                onRemoveAnnotation={onRemoveAnnotation}
                onClearAnnotations={onClearAnnotations}
              />
            )}

            {/* Part 32: Visual Watermark Overlay on Shared Screen Canvas (Disabled to prevent visual clutter) */}
            <WatermarkOverlay
              enabled={false}
              mode={watermarkSettings?.visualMode || 'repeated'}
              visibleOn={watermarkSettings?.visibleOn || 'both'}
              containerType="sharedContent"
              opacity={watermarkSettings?.opacity || 25}
              identity={watermarkIdentityStr}
              subtext="CONFIDENTIAL"
            />
          </div>

          {/* Right: Side-by-Side Participants (Section 13.15: only if layout === 'side-by-side') */}
          {presenterLayout === 'side-by-side' && (
            <div className="w-72 flex flex-col gap-3 overflow-y-auto pr-1">
              {screenShareSubMode === 'speaker' ? (
                <div className="h-48 shrink-0">
                  {renderParticipantTile(primaryParticipants[0] || orderedParticipants[0], true, false)}
                </div>
              ) : (
                orderedParticipants.map(p => (
                  <div key={p.id} className="h-36 shrink-0">
                    {renderParticipantTile(p, false, true)}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT 3: IMMERSIVE VIEW (Section 9.10)
  // --------------------------------------------------------------------------
  if (layoutMode === 'immersive') {
    return (
      <div className="w-full h-full relative p-6 flex flex-col items-center justify-center select-none overflow-hidden">
        <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-[#444] shadow-2xl relative bg-gradient-to-b from-[#1C2333] via-[#0E131F] to-[#0A0D14] flex flex-col justify-between p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/25 via-transparent to-black pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-center bg-black/50 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 w-fit">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Immersive Classroom & Boardroom Scene
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-5 gap-6 pt-10">
            {orderedParticipants.map((p, idx) => (
              <div 
                key={p.id}
                className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105"
                onClick={() => onTogglePinParticipant(p.id)}
              >
                <div className={`w-24 h-24 rounded-2xl overflow-hidden border-2 shadow-2xl flex items-center justify-center relative bg-gradient-to-t from-black via-gray-900 to-gray-800 ${
                  p.isSpeaking ? 'border-emerald-400 ring-4 ring-emerald-500/30' : 'border-blue-400/40'
                }`}>
                  <span className="text-4xl">
                    {idx === 0 ? '👔' : idx === 1 ? '👩‍💼' : idx === 2 ? '👨‍💻' : '🧑‍🏫'}
                  </span>
                  {p.isMuted && (
                    <div className="absolute top-1 right-1 p-1 bg-red-600 rounded-full text-white">
                      <MicOff className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <div className="mt-2 bg-black/70 border border-white/10 px-3 py-0.5 rounded-full text-[11px] font-bold text-gray-200 shadow-md backdrop-blur-sm">
                  {p.name}
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 w-full text-center text-[11px] text-gray-400 font-mono">
            Shared Virtual Classroom • Up to 25 Seated Attendees
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT 4: MULTI-SPEAKER VIEW (Section 9.8 & 37.7)
  // --------------------------------------------------------------------------
  if (layoutMode === 'multi' || layoutMode === 'multi-speaker') {
    const speakerCount = Math.min(Math.max(Number(multiSpeakerCount) || 2, 2), 4);
    const topSpeakers = orderedParticipants.slice(0, speakerCount);
    const otherParticipants = orderedParticipants.slice(speakerCount);

    const gridClass = 
      speakerCount === 2 ? 'grid-cols-2' :
      speakerCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
      'grid-cols-2 grid-rows-2';

    return (
      <div className="w-full h-full flex flex-col p-4 gap-4">
        {/* Active Multi-Speaker Indicator */}
        <div className="flex items-center justify-between px-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-300">
              Multi-Speaker View • {speakerCount} Active Speakers Focused
            </span>
          </div>
          <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            Personal Layout (37.7)
          </span>
        </div>

        {/* Primary Speaker Tiles Enlarge According to Multi-Speaker Count */}
        <div className={`flex-1 grid ${gridClass} gap-4 min-h-0`}>
          {topSpeakers.map(p => (
            <div key={p.id} className="w-full h-full relative">
              {renderParticipantTile(p, true, false)}
            </div>
          ))}
        </div>

        {/* Bottom Thumbnail Gallery Strip */}
        {otherParticipants.length > 0 && (
          <div className="flex gap-3 overflow-x-auto shrink-0 h-28 pt-1">
            {otherParticipants.map(p => (
              <div key={p.id} className="w-44 h-full shrink-0">
                {renderParticipantTile(p, false, true)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT 5: SPEAKER VIEW (Section 9.2 - Supports Multi-Pin & Multi-Spotlight)
  // --------------------------------------------------------------------------
  if (layoutMode === 'speaker') {
    const focalItems = primaryParticipants;
    const secondaryParticipants = orderedParticipants.filter(p => !focalItems.some(f => f.id === p.id));

    return (
      <div className="w-full h-full flex flex-col p-4 gap-4">
        {/* Top Strip of Non-Focal Attendees */}
        {secondaryParticipants.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 shrink-0 h-28">
            {secondaryParticipants.map(p => (
              <div 
                key={p.id} 
                className="w-44 h-full shrink-0 cursor-pointer"
                onClick={() => onTogglePinParticipant(p.id)}
              >
                {renderParticipantTile(p, false, true)}
              </div>
            ))}
          </div>
        )}

        {/* Hero Speaker / Spotlight / Pinned Stage */}
        <div className="flex-1 w-full relative flex items-center justify-center min-h-0">
          <div className={`w-full h-full max-w-5xl ${
            focalItems.length > 1 ? 'grid grid-cols-2 gap-4' : 'aspect-video'
          }`}>
            {focalItems.map(p => (
              <div key={p.id} className="w-full h-full">
                {renderParticipantTile(p, true, false)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT 6: DYNAMIC GALLERY VIEW (Section 9.9 - Face-centric auto-crop)
  // --------------------------------------------------------------------------
  if (layoutMode === 'dynamic-gallery') {
    return (
      <div className="w-full h-full p-4 flex flex-col items-center justify-center overflow-hidden">
        <div className="w-full max-w-6xl grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-2 items-center justify-center">
          {orderedParticipants.map(p => (
            <div key={p.id} className="w-full aspect-[3/4]">
              {renderParticipantTile(p, false, false, true)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT 7: GALLERY VIEW (DEFAULT - Section 9.3 & 9.4 with Pagination)
  // --------------------------------------------------------------------------
  const totalPages = Math.ceil(orderedParticipants.length / PAGE_SIZE) || 1;
  const pagedParticipants = orderedParticipants.slice(galleryPage * PAGE_SIZE, (galleryPage + 1) * PAGE_SIZE);

  const count = pagedParticipants.length;
  let gridClass = 'grid-cols-1 max-w-3xl aspect-video';
  if (count === 2) gridClass = 'grid-cols-2 max-w-5xl aspect-video';
  else if (count <= 4) gridClass = 'grid-cols-2 max-w-5xl aspect-[4/3]';
  else if (count <= 6) gridClass = 'grid-cols-3 max-w-6xl aspect-[16/9]';
  else gridClass = 'grid-cols-3 max-w-6xl aspect-[16/9]';

  return (
    <div className="w-full h-full p-4 flex flex-col items-center justify-center overflow-hidden relative">
      
      {/* Host Custom Order Toolbar Banner (Section 9.4) */}
      {hasCustomReorder && (
        <div className="absolute top-4 bg-[#242424]/90 border border-blue-500/40 rounded-xl px-4 py-2 flex items-center gap-3 text-xs z-30 shadow-xl backdrop-blur-md">
          <span className="text-gray-300">Custom Gallery Order active</span>
          {isHostOrCoHost && onHostBroadcastVideoOrder && (
            <button
              onClick={() => onHostBroadcastVideoOrder(customOrder)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-md"
            >
              Follow Host's Video Order
            </button>
          )}
          <button
            onClick={handleResetCustomOrder}
            className="px-2 py-1 text-gray-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      )}

      {/* Gallery Grid */}
      <div className={`w-full flex-1 grid gap-4 p-2 ${gridClass} items-center justify-center min-h-0`}>
        {pagedParticipants.map(p => (
          <div key={p.id} className="w-full h-full max-h-[70vh]">
            {renderParticipantTile(p, false, false)}
          </div>
        ))}
      </div>

      {/* Pagination Bar (Section 9.3: Next Page / Previous Page) */}
      {totalPages > 1 && (
        <div className="pt-2 flex items-center gap-3 text-xs text-gray-300 z-20">
          <button
            onClick={() => setGalleryPage(prev => Math.max(0, prev - 1))}
            disabled={galleryPage === 0}
            className="px-3 py-1.5 bg-[#252525] hover:bg-[#333] disabled:opacity-40 rounded-xl border border-[#3A3A3A] flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous Page
          </button>
          <span className="font-semibold text-gray-400 font-mono">
            Page {galleryPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setGalleryPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={galleryPage >= totalPages - 1}
            className="px-3 py-1.5 bg-[#252525] hover:bg-[#333] disabled:opacity-40 rounded-xl border border-[#3A3A3A] flex items-center gap-1"
          >
            Next Page <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
