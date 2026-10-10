import React, { useState, useEffect } from 'react';
import { 
  X, Settings, HardDrive, Folder, Check, Shield, 
  Users, Laptop, Cloud, Clock, Video, Eye, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecordingSettingsModal({
  isOpen,
  onClose,
  isHost,
  settings = {},
  onUpdateSettings,
  participants = [],
  onUpdateParticipantPermission
}) {
  const [localPath, setLocalPath] = useState(settings.localRecordingPath || 'C:\\Users\\User\\Documents\\IntellMeet\\Recordings');
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(!!settings.autoRecording?.enabled);
  const [autoRecordType, setAutoRecordType] = useState(settings.autoRecording?.type || 'CLOUD');
  const [showNames, setShowNames] = useState(settings.showParticipantNames !== false);
  const [includeTimestamp, setIncludeTimestamp] = useState(settings.includeTimestamp !== false);
  const [recordScreenWithVideo, setRecordScreenWithVideo] = useState(settings.recordScreenWithVideo !== false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'permissions'

  useEffect(() => {
    if (settings) {
      if (settings.localRecordingPath) setLocalPath(settings.localRecordingPath);
      if (settings.autoRecording) {
        setAutoRecordEnabled(!!settings.autoRecording.enabled);
        setAutoRecordType(settings.autoRecording.type || 'CLOUD');
      }
      if (settings.showParticipantNames !== undefined) setShowNames(settings.showParticipantNames);
      if (settings.includeTimestamp !== undefined) setIncludeTimestamp(settings.includeTimestamp);
      if (settings.recordScreenWithVideo !== undefined) setRecordScreenWithVideo(settings.recordScreenWithVideo);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateSettings?.({
      localRecordingPath: localPath,
      autoRecording: {
        enabled: autoRecordEnabled,
        type: autoRecordType
      },
      showParticipantNames: showNames,
      includeTimestamp: includeTimestamp,
      recordScreenWithVideo: recordScreenWithVideo
    });
    toast.success('Recording settings updated');
    onClose();
  };

  const cloudStorage = settings.cloudStorage || { usedBytes: 1258291200, quotaBytes: 5368709120 };
  const usedGB = (cloudStorage.usedBytes / (1024 * 1024 * 1024)).toFixed(1);
  const quotaGB = (cloudStorage.quotaBytes / (1024 * 1024 * 1024)).toFixed(1);
  const usedPct = Math.min(100, Math.round((cloudStorage.usedBytes / cloudStorage.quotaBytes) * 100));

  const permissions = settings.participantRecordingPermissions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1C1C1C] border border-[#333] rounded-3xl w-full max-w-xl text-gray-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Recording Settings (23.4, 23.13)</h3>
              <p className="text-xs text-gray-400">Configure local & cloud storage, automation, and permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {isHost && (
          <div className="flex px-6 pt-3 border-b border-white/10 gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-2.5 transition-all border-b-2 ${
                activeTab === 'general'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              General Settings
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`pb-2.5 transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Participant Recording Permissions (23.5)
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {activeTab === 'general' ? (
            <>
              {/* 23.4 Local Recording Location */}
              <div className="space-y-2">
                <label className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-blue-400" />
                  Local Recording Storage Location (23.4)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    className="flex-1 bg-[#242424] border border-[#3A3A3A] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    placeholder="C:\Users\Username\Documents\IntellMeet\Recordings"
                  />
                  <button
                    type="button"
                    onClick={() => toast('Default path reset to Documents folder')}
                    className="px-3 py-2 bg-[#2E2E2E] hover:bg-[#383838] border border-white/10 rounded-xl font-medium text-gray-300"
                  >
                    Browse
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Local recordings exist only on this computer. IntellMeet does not store a local recording copy in the cloud.
                </p>
              </div>

              {/* 23.15 Cloud Storage Management */}
              <div className="space-y-2 bg-[#222] p-3.5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-purple-400" /> Cloud Storage Allocation (23.15)
                  </span>
                  <span className="font-mono text-purple-300 font-bold">{usedGB} GB / {quotaGB} GB</span>
                </div>
                <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 flex items-center justify-between">
                  <span>{100 - usedPct}% storage remaining</span>
                  <span className="text-emerald-400">Cloud active</span>
                </p>
              </div>

              {/* 23.12 Automatic Recording */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-200 block text-xs">Automatic Recording (23.12)</span>
                    <span className="text-gray-400 text-[11px]">Start recording automatically when the meeting begins</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRecordEnabled}
                    onChange={(e) => setAutoRecordEnabled(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                {autoRecordEnabled && (
                  <div className="flex items-center gap-3 pl-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                      <input
                        type="radio"
                        name="autoRecordType"
                        value="CLOUD"
                        checked={autoRecordType === 'CLOUD'}
                        onChange={() => setAutoRecordType('CLOUD')}
                        className="accent-purple-600"
                      />
                      <span>Record to Cloud</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
                      <input
                        type="radio"
                        name="autoRecordType"
                        value="LOCAL"
                        checked={autoRecordType === 'LOCAL'}
                        onChange={() => setAutoRecordType('LOCAL')}
                        className="accent-purple-600"
                      />
                      <span>Record on Computer</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 23.13 Additional Recording Settings */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Video & Display Options (23.13)
                </span>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Show participant names in video</span>
                  <input
                    type="checkbox"
                    checked={showNames}
                    onChange={(e) => setShowNames(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Include timestamp in recording</span>
                  <input
                    type="checkbox"
                    checked={includeTimestamp}
                    onChange={(e) => setIncludeTimestamp(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Record video during screen sharing</span>
                  <input
                    type="checkbox"
                    checked={recordScreenWithVideo}
                    onChange={(e) => setRecordScreenWithVideo(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </>
          ) : (
            /* 23.5 Give a Participant Recording Permission */
            <div className="space-y-3">
              <div className="bg-blue-950/30 border border-blue-800/40 p-3 rounded-xl text-blue-200 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                <span>
                  By default, participants cannot record without the host's permission. Grant permissions below to allow participants to record locally to their computer.
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {participants.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">No participants currently in room</p>
                ) : (
                  participants.map(p => {
                    const pId = p.id || p._id || p.peerID;
                    const permObj = permissions.find(pm => pm.userId === pId);
                    const isAllowed = permObj ? permObj.allowed : false;

                    return (
                      <div key={pId} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-white block">{p.name || 'Participant'}</span>
                          <span className="text-[10px] text-gray-400">{p.email || pId}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateParticipantPermission?.(pId, p.name || 'Participant', !isAllowed);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-all ${
                            isAllowed
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                          }`}
                        >
                          {isAllowed ? 'Revoke Permission' : 'Allow Record'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#161616]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
