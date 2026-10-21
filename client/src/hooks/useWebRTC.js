import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCManager, DEFAULT_ICE_SERVERS } from '../services/webRTCManager';

/**
 * useWebRTC — Production-ready React hook for real-time WebRTC audio & video communication
 * Encapsulates RTCPeerConnection management, perfect negotiation, and track lifecycle.
 */
export function useWebRTC({ socket, localStream, meetingId, iceServers = DEFAULT_ICE_SERVERS }) {
  const [peers, setPeers] = useState([]);
  const [connectionStates, setConnectionStates] = useState({});
  const managerRef = useRef(null);

  // Initialize or re-configure manager
  useEffect(() => {
    if (!socket) return;

    const manager = new WebRTCManager({
      socket,
      localStream,
      iceServers,
      onStreamUpdate: (socketId, stream, peer) => {
        setPeers(manager.getPeerEntries());
      },
      onPeerLeft: (socketId) => {
        setPeers(manager.getPeerEntries());
        setConnectionStates(prev => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      },
      onStateChange: (socketId, connectionState, iceState) => {
        setConnectionStates(prev => ({
          ...prev,
          [socketId]: { connectionState, iceState }
        }));
      }
    });

    managerRef.current = manager;

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, [socket, iceServers]);

  // Sync local stream changes
  useEffect(() => {
    if (managerRef.current && localStream) {
      managerRef.current.setLocalStream(localStream);
    }
  }, [localStream]);

  const connectToUser = useCallback((targetSocketId, userId, userName) => {
    if (managerRef.current) {
      const peer = managerRef.current.connectToUser(targetSocketId, userId, userName);
      setPeers(managerRef.current.getPeerEntries());
      return peer;
    }
    return null;
  }, []);

  const removePeer = useCallback((socketId) => {
    if (managerRef.current) {
      managerRef.current.removePeer(socketId);
      setPeers(managerRef.current.getPeerEntries());
    }
  }, []);

  const replaceVideoTrack = useCallback(async (newTrack) => {
    if (managerRef.current) {
      await managerRef.current.replaceVideoTrack(newTrack);
    }
  }, []);

  const replaceAudioTrack = useCallback(async (newTrack) => {
    if (managerRef.current) {
      await managerRef.current.replaceAudioTrack(newTrack);
    }
  }, []);

  const setAudioEnabled = useCallback((enabled) => {
    if (managerRef.current) {
      managerRef.current.setAudioEnabled(enabled);
    }
  }, []);

  const setVideoEnabled = useCallback((enabled) => {
    if (managerRef.current) {
      managerRef.current.setVideoEnabled(enabled);
    }
  }, []);

  return {
    manager: managerRef.current,
    peers,
    connectionStates,
    connectToUser,
    removePeer,
    replaceVideoTrack,
    replaceAudioTrack,
    setAudioEnabled,
    setVideoEnabled
  };
}
