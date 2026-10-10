import React, { useState } from 'react';
import { 
  Monitor, Layout, Square, Camera, FileText, Film, Edit3, 
  Volume2, Sliders, X, Check, Eye, ChevronRight, Presentation
} from 'lucide-react';

export const SHARING_SOURCES = {
  SCREEN: { id: 'SCREEN', name: 'Entire Screen', icon: Monitor, desc: 'Share your primary or secondary display' },
  APPLICATION: { id: 'APPLICATION', name: 'Application Window', icon: Layout, desc: 'Share Chrome, VS Code, or PowerPoint only' },
  PRESENTATION: { id: 'PRESENTATION', name: 'Presentation Slides', icon: Presentation, desc: 'PowerPoint, Google Slides, Keynote with Slide Control' },
  WHITEBOARD: { id: 'WHITEBOARD', name: 'Whiteboard', icon: Edit3, desc: 'Interactive collaborative canvas for drawing & notes' },
  PORTION: { id: 'PORTION', name: 'Portion of Screen', icon: Square, desc: 'Select and broadcast a resizable rectangular region' },
  CAMERA: { id: 'CAMERA', name: 'Second Camera', icon: Camera, desc: 'Document camera or secondary physical camera source' },
  VIDEO: { id: 'VIDEO', name: 'Video / Media', icon: Film, desc: 'Share local video clip with optimized playback & sound' },
  DOCUMENT: { id: 'DOCUMENT', name: 'Documents', icon: FileText, desc: 'Present PDF, presentation slides, or documents' }
};

export default function ShareContentModal({
  isOpen,
  onClose,
  onStartShare,
  availableCameras = [],
  isHost = false
}) {
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'advanced'
  const [selectedSource, setSelectedSource] = useState('SCREEN');
  const [selectedApp, setSelectedApp] = useState('chrome');
  const [selectedPresentationType, setSelectedPresentationType] = useState('POWERPOINT');
  const [presentationDeckTitle, setPresentationDeckTitle] = useState('IntellMeet Architecture & Product Roadmap');
  const [selectedCameraId, setSelectedCameraId] = useState(availableCameras[0]?.deviceId || 'default');
  const [shareAudio, setShareAudio] = useState(true);
  const [optimizeVideo, setOptimizeVideo] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('Product_Roadmap_2026.pdf');

  if (!isOpen) return null;

  const handleStart = () => {
    let sourceDetails = {
      type: selectedSource,
      audioEnabled: shareAudio,
      videoOptimization: optimizeVideo,
      sourceName: SHARING_SOURCES[selectedSource].name,
      appChoice: selectedApp,
      cameraId: selectedCameraId,
      videoFile: videoFile,
      videoPreviewUrl: videoPreviewUrl,
      documentName: selectedDoc,
      presentationType: selectedPresentationType,
      presentationName: presentationDeckTitle
    };

    if (selectedSource === 'PRESENTATION') {
      const typeLabel = {
        POWERPOINT: 'PowerPoint',
        OFFICE_365: 'Office 365 Slides',
        GOOGLE_SLIDES: 'Google Slides',
        KEYNOTE: 'Apple Keynote',
        PDF: 'Presentation Deck'
      }[selectedPresentationType] || 'Presentation';
      sourceDetails.sourceName = `${typeLabel}: ${presentationDeckTitle}`;
    } else if (selectedSource === 'APPLICATION') {
      const appNames = {
        chrome: 'Google Chrome - Dashboard',
        vscode: 'Visual Studio Code - IntellMeet',
        powerpoint: 'PowerPoint - Presentation.pptx',
        excel: 'Microsoft Excel - Q3 Financials'
      };
      sourceDetails.sourceName = appNames[selectedApp] || 'Application Window';
      if (selectedApp === 'powerpoint') {
        sourceDetails.presentationType = 'POWERPOINT';
        sourceDetails.presentationName = 'PowerPoint - Presentation.pptx';
      }
    } else if (selectedSource === 'CAMERA') {
      const cam = availableCameras.find(c => c.deviceId === selectedCameraId);
      sourceDetails.sourceName = cam?.label || 'Second Camera';
    } else if (selectedSource === 'VIDEO' && videoFile) {
      sourceDetails.sourceName = `Video: ${videoFile.name}`;
    } else if (selectedSource === 'DOCUMENT') {
      sourceDetails.sourceName = `Document: ${selectedDoc}`;
      sourceDetails.presentationType = 'PDF';
      sourceDetails.presentationName = selectedDoc;
    }

    onStartShare(sourceDetails);
    onClose();
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#202020]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Share Content</h3>
              <p className="text-xs text-gray-400">Select what you would like to broadcast to participants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs (13.1 & 13.19) */}
        <div className="flex border-b border-[#2A2A2A] px-6 bg-[#161616]">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Basic Sharing
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'advanced'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Advanced & Media Sources
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[420px] space-y-4">
          {activeTab === 'basic' ? (
            <div className="grid grid-cols-4 gap-2.5">
              {/* Entire Screen (13.2) */}
              <button
                type="button"
                onClick={() => setSelectedSource('SCREEN')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  selectedSource === 'SCREEN'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                    : 'bg-[#222] border-[#333] hover:bg-[#282828] text-gray-300'
                }`}
              >
                <div className="w-12 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center mb-2">
                  <Monitor className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-semibold">Entire Screen</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Desktop 1</span>
              </button>

              {/* Application / Window (13.3) */}
              <button
                type="button"
                onClick={() => setSelectedSource('APPLICATION')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  selectedSource === 'APPLICATION'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                    : 'bg-[#222] border-[#333] hover:bg-[#282828] text-gray-300'
                }`}
              >
                <div className="w-12 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center mb-2">
                  <Layout className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs font-semibold">Window / App</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Chrome, etc.</span>
              </button>

              {/* Presentation Slides (Part 16: 16.1 & 16.7) */}
              <button
                type="button"
                onClick={() => setSelectedSource('PRESENTATION')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  selectedSource === 'PRESENTATION'
                    ? 'bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/30 text-white'
                    : 'bg-[#222] border-[#333] hover:bg-[#282828] text-gray-300'
                }`}
              >
                <div className="w-12 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center mb-2">
                  <Presentation className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-xs font-semibold">Slide Deck</span>
                <span className="text-[10px] text-orange-300 mt-0.5">Slide Control 👥</span>
              </button>

              {/* Whiteboard (13.8) */}
              <button
                type="button"
                onClick={() => setSelectedSource('WHITEBOARD')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  selectedSource === 'WHITEBOARD'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                    : 'bg-[#222] border-[#333] hover:bg-[#282828] text-gray-300'
                }`}
              >
                <div className="w-12 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center mb-2">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs font-semibold">Whiteboard</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Canvas</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Portion of Screen (13.4) */}
              <button
                type="button"
                onClick={() => setSelectedSource('PORTION')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  selectedSource === 'PORTION'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                    : 'bg-[#222] border-[#333] hover:bg-[#282828] text-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                  <Square className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold block">Portion of Screen</span>
                  <span className="text-[10px] text-gray-400">Share a resizable rectangular frame on your screen</span>
                </div>
              </button>

              {/* Second Camera (13.7) */}
              <button
                type="button"
                onClick={() => setSelectedSource('CAMERA')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  selectedSource === 'CAMERA'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                    : 'bg-[#222] border-[#333] hover:bg-[#282828] text-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold block">Second Camera</span>
                  <span className="text-[10px] text-gray-400">Document cam or physical object showcase</span>
                </div>
              </button>

              {/* Video / Media (13.6) */}
              <button
                type="button"
                onClick={() => setSelectedSource('VIDEO')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  selectedSource === 'VIDEO'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                    : 'bg-[#222] border-[#333] hover:bg-[#282828] text-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold block">Video / Media File</span>
                  <span className="text-[10px] text-gray-400">Broadcast local MP4/WebM video with audio sync</span>
                </div>
              </button>

              {/* Documents (13.9) */}
              <button
                type="button"
                onClick={() => setSelectedSource('DOCUMENT')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  selectedSource === 'DOCUMENT'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                    : 'bg-[#222] border-[#333] hover:bg-[#282828] text-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold block">Document Presenter</span>
                  <span className="text-[10px] text-gray-400">PDF slides and document presentation deck</span>
                </div>
              </button>
            </div>
          )}

          {/* Conditional Sub-settings per Selected Source */}
          {selectedSource === 'APPLICATION' && (
            <div className="p-3 bg-[#242424] rounded-xl border border-[#333] space-y-2">
              <span className="text-[11px] font-semibold text-gray-300 block">Select Application Window:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'chrome', name: 'Google Chrome', detail: 'IntellMeet Dashboard' },
                  { id: 'vscode', name: 'Visual Studio Code', detail: 'MeetingRoom.jsx' },
                  { id: 'powerpoint', name: 'Microsoft PowerPoint', detail: 'Q3 Overview.pptx' },
                  { id: 'excel', name: 'Microsoft Excel', detail: 'Financials_2026.xlsx' }
                ].map(app => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedApp(app.id)}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between ${
                      selectedApp === app.id ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-[#1C1C1C] border-[#333] text-gray-400'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold text-white truncate">{app.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{app.detail}</div>
                    </div>
                    {selectedApp === app.id && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Presentation Deck Settings (Part 16: 16.2 & 16.7) */}
          {selectedSource === 'PRESENTATION' && (
            <div className="p-3.5 bg-[#20222A] rounded-xl border border-orange-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-orange-300 uppercase tracking-wider">
                  Select Presentation Application (Zoom Parity 16.7):
                </span>
                <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30">
                  Slide Control Enabled
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'POWERPOINT', name: 'Microsoft PowerPoint', detail: 'Native Windows/Mac Desktop' },
                  { id: 'OFFICE_365', name: 'Office 365 PowerPoint', detail: 'Cloud Slideshow View' },
                  { id: 'GOOGLE_SLIDES', name: 'Google Slides', detail: 'Full-screen Presentation' },
                  { id: 'KEYNOTE', name: 'Apple Keynote', detail: 'Full-screen Keynote Mode' },
                ].map(app => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedPresentationType(app.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      selectedPresentationType === app.id
                        ? 'bg-orange-600/30 border-orange-500 text-orange-200'
                        : 'bg-[#181920] border-[#333] text-gray-400 hover:text-white hover:bg-[#252733]'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold text-white truncate">{app.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{app.detail}</div>
                    </div>
                    {selectedPresentationType === app.id && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Presentation Deck Title:
                </label>
                <input
                  type="text"
                  value={presentationDeckTitle}
                  onChange={(e) => setPresentationDeckTitle(e.target.value)}
                  placeholder="Enter presentation title..."
                  className="w-full bg-[#16171E] border border-[#3A3D4D] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {selectedSource === 'CAMERA' && (
            <div className="p-3 bg-[#242424] rounded-xl border border-[#333] space-y-2">
              <span className="text-[11px] font-semibold text-gray-300 block">Select Second Camera Device:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg p-2 text-xs text-white outline-none"
              >
                {availableCameras.length > 0 ? (
                  availableCameras.map(cam => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label || `Camera (${cam.deviceId.slice(0, 8)})`}
                    </option>
                  ))
                ) : (
                  <option value="default">Document Camera (Integrated/External)</option>
                )}
              </select>
            </div>
          )}

          {selectedSource === 'VIDEO' && (
            <div className="p-3 bg-[#242424] rounded-xl border border-[#333] space-y-2">
              <span className="text-[11px] font-semibold text-gray-300 block">Choose Video File:</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                onChange={handleVideoUpload}
                className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
              {videoFile && (
                <div className="text-[11px] text-emerald-400 font-medium">
                  ✓ Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
              )}
            </div>
          )}

          {selectedSource === 'DOCUMENT' && (
            <div className="p-3 bg-[#242424] rounded-xl border border-[#333] space-y-2">
              <span className="text-[11px] font-semibold text-gray-300 block">Select Presentation Deck / Document:</span>
              <div className="space-y-1 text-xs">
                {['Product_Roadmap_2026.pdf', 'IntellMeet_Architecture_Overview.pdf', 'Board_Meeting_Slides.pdf'].map(doc => (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between ${
                      selectedDoc === doc ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' : 'bg-[#1C1C1C] border-[#333] text-gray-400'
                    }`}
                  >
                    <span>{doc}</span>
                    {selectedDoc === doc && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSource === 'PORTION' && (
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200">
              💡 <strong>Portion Sharing Mode:</strong> A green adjustable frame will be placed over your screen. Only contents inside the rectangle will be transmitted to other meeting participants.
            </div>
          )}
        </div>

        {/* Footer Controls & Toggles (13.5, 13.6, 13.19) */}
        <div className="p-4 bg-[#1F1F1F] border-t border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Share Computer Audio (13.5) */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white">
              <input
                type="checkbox"
                checked={shareAudio}
                onChange={(e) => setShareAudio(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Share Sound
              </span>
            </label>

            {/* Optimize for Video (13.6) */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white" title="Improves frame rate for video playback, but may blur static text">
              <input
                type="checkbox"
                checked={optimizeVideo}
                onChange={(e) => setOptimizeVideo(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Optimize for Video Clip
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#2B2B2B] hover:bg-[#333] text-gray-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <span>Share</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
