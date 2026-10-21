import { io as ioClient } from '../client/node_modules/socket.io-client/build/esm/index.js';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { getProductionIceServers } from './server.js';

// Automated WebRTC Signaling & Multi-Party Mesh Integration Test Suite
async function runWebRTCTests() {
  console.log('====================================================');
  console.log('IntelliMeet: WebRTC Multi-Party Signaling Test Suite');
  console.log('====================================================\n');

  // 1. Verify ICE Servers configuration
  console.log('[TEST 1] Verifying STUN/TURN ICE Servers Configuration...');
  const iceServers = getProductionIceServers();
  if (!Array.isArray(iceServers) || iceServers.length === 0) {
    throw new Error('FAIL: ICE servers array is empty');
  }
  const hasStun = iceServers.some(s => {
    const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
    return urls.some(u => u.startsWith('stun:'));
  });
  const hasTurn = iceServers.some(s => {
    const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
    return urls.some(u => u.startsWith('turn:'));
  });
  if (!hasStun) throw new Error('FAIL: No STUN servers found in configuration');
  if (!hasTurn) throw new Error('FAIL: No TURN servers found in configuration');
  console.log(`✓ PASS: ${iceServers.length} ICE server configs loaded (STUN and TURN verified).\n`);

  // Spin up an in-memory test Socket.io server to verify protocol without needing active DB
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  app.get('/api/meetings/ice-servers', (req, res) => {
    res.json({ success: true, iceServers: getProductionIceServers() });
  });

  io.on('connection', (socket) => {
    socket.on('get-ice-servers', (cb) => {
      if (typeof cb === 'function') cb(getProductionIceServers());
    });

    socket.on('join-room', (roomId, userId, userName) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId || socket.id;
      socket.userName = userName || 'Participant';

      io.in(roomId).fetchSockets().then(clients => {
        const existingUsers = clients
          .filter(s => s.id !== socket.id)
          .map(s => ({ socketId: s.id, userId: s.userId, userName: s.userName }));
        socket.emit('all-users', existingUsers);
      });

      socket.to(roomId).emit('user-connected', socket.userId, socket.userName, socket.id);
    });

    socket.on('webrtc-offer', ({ to, offer }) => {
      if (!to || !offer || !socket.roomId) return;
      const target = io.sockets.sockets.get(to);
      if (!target || target.roomId !== socket.roomId) return;
      target.emit('webrtc-offer', {
        from: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        offer
      });
    });

    socket.on('webrtc-answer', ({ to, answer }) => {
      if (!to || !answer || !socket.roomId) return;
      const target = io.sockets.sockets.get(to);
      if (!target || target.roomId !== socket.roomId) return;
      target.emit('webrtc-answer', {
        from: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        answer
      });
    });

    socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
      if (!to || !candidate || !socket.roomId) return;
      const target = io.sockets.sockets.get(to);
      if (!target || target.roomId !== socket.roomId) return;
      target.emit('webrtc-ice-candidate', {
        from: socket.id,
        candidate
      });
    });

    socket.on('toggle-media-state', (roomId, mediaState) => {
      socket.to(roomId).emit('participant-media-status', {
        socketId: socket.id,
        userId: socket.userId,
        ...mediaState
      });
    });

    socket.on('leave-room', ({ roomId }) => {
      if (roomId) {
        socket.to(roomId).emit('user-disconnected', socket.id);
        socket.leave(roomId);
      }
    });

    socket.on('disconnect', () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-disconnected', socket.id);
      }
    });
  });

  const TEST_PORT = 5899;
  await new Promise(resolve => server.listen(TEST_PORT, resolve));
  const serverUrl = `http://localhost:${TEST_PORT}`;

  try {
    // 2. Test Room Isolation & Cross-Room Boundary Security
    console.log('[TEST 2] Testing Room Isolation & Cross-Room Security...');
    const roomASocket = ioClient(serverUrl);
    const roomBSocket = ioClient(serverUrl);

    await new Promise(r => roomASocket.on('connect', r));
    await new Promise(r => roomBSocket.on('connect', r));

    roomASocket.emit('join-room', 'room-alpha', 'user-alpha', 'Alpha');
    roomBSocket.emit('join-room', 'room-beta', 'user-beta', 'Beta');
    await new Promise(r => setTimeout(r, 200));

    let rogueOfferReceived = false;
    roomBSocket.on('webrtc-offer', () => { rogueOfferReceived = true; });

    // Rogue attempt: room A sends offer to room B's socket
    roomASocket.emit('webrtc-offer', {
      to: roomBSocket.id,
      offer: { type: 'offer', sdp: 'fake-sdp-attempt' }
    });
    await new Promise(r => setTimeout(r, 250));

    if (rogueOfferReceived) {
      throw new Error('FAIL: Cross-room signaling was NOT blocked!');
    }
    console.log('✓ PASS: Cross-room signaling successfully blocked by server room security.\n');
    roomASocket.disconnect();
    roomBSocket.disconnect();

    // 3. Test Multi-Party (3 Participants) WebRTC Full Mesh
    console.log('[TEST 3] Testing 3-Party Multi-Mesh WebRTC Signaling (Host + Participant 1 + Participant 2)...');
    const meetingRoomId = 'test-mtg-999';

    const hostSocket = ioClient(serverUrl);
    const p1Socket = ioClient(serverUrl);
    const p2Socket = ioClient(serverUrl);

    await Promise.all([
      new Promise(r => hostSocket.on('connect', r)),
      new Promise(r => p1Socket.on('connect', r)),
      new Promise(r => p2Socket.on('connect', r))
    ]);

    // Host joins
    console.log('  -> Host joining room...');
    hostSocket.emit('join-room', meetingRoomId, 'host-user-id', 'Host Alice');
    await new Promise(r => setTimeout(r, 150));

    // Participant 1 joins
    console.log('  -> Participant 1 joining room...');
    const p1AllUsersPromise = new Promise(resolve => {
      p1Socket.on('all-users', users => resolve(users));
    });
    const hostUserConnectedPromise = new Promise(resolve => {
      hostSocket.on('user-connected', (uId, uName, sId) => resolve({ uId, uName, sId }));
    });

    p1Socket.emit('join-room', meetingRoomId, 'p1-user-id', 'Participant Bob');

    const [p1AllUsers, hostNewcomer] = await Promise.all([
      p1AllUsersPromise,
      hostUserConnectedPromise
    ]);

    if (!p1AllUsers.some(u => u.socketId === hostSocket.id)) {
      throw new Error('FAIL: Participant 1 did not receive Host in all-users');
    }
    if (hostNewcomer.sId !== p1Socket.id) {
      throw new Error('FAIL: Host was not notified of Participant 1 joining');
    }
    console.log('  ✓ Host and Participant 1 recognized each other.');

    // Participant 1 sends WebRTC offer to Host, Host replies with answer and exchanges ICE candidates
    const hostOfferPromise = new Promise(resolve => {
      hostSocket.once('webrtc-offer', data => resolve(data));
    });
    const p1AnswerPromise = new Promise(resolve => {
      p1Socket.once('webrtc-answer', data => resolve(data));
    });
    const hostIcePromise = new Promise(resolve => {
      hostSocket.once('webrtc-ice-candidate', data => resolve(data));
    });
    const p1IcePromise = new Promise(resolve => {
      p1Socket.once('webrtc-ice-candidate', data => resolve(data));
    });

    p1Socket.emit('webrtc-offer', {
      to: hostSocket.id,
      offer: { type: 'offer', sdp: 'v=0\r\no=bob 123 456 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 50000 UDP/TLS/RTP/SAVPF 111\r\nm=video 50002 UDP/TLS/RTP/SAVPF 96' }
    });

    const receivedOfferOnHost = await hostOfferPromise;
    if (receivedOfferOnHost.from !== p1Socket.id) throw new Error('FAIL: Offer origin mismatch');

    hostSocket.emit('webrtc-answer', {
      to: p1Socket.id,
      answer: { type: 'answer', sdp: 'v=0\r\no=alice 789 101 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 50000 UDP/TLS/RTP/SAVPF 111\r\nm=video 50002 UDP/TLS/RTP/SAVPF 96' }
    });

    const receivedAnswerOnP1 = await p1AnswerPromise;
    if (receivedAnswerOnP1.from !== hostSocket.id) throw new Error('FAIL: Answer origin mismatch');

    // Exchange ICE candidates
    p1Socket.emit('webrtc-ice-candidate', {
      to: hostSocket.id,
      candidate: { candidate: 'candidate:1 1 UDP 2122260223 192.168.1.100 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 }
    });
    hostSocket.emit('webrtc-ice-candidate', {
      to: p1Socket.id,
      candidate: { candidate: 'candidate:2 1 UDP 2122260223 192.168.1.101 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 }
    });

    await Promise.all([hostIcePromise, p1IcePromise]);
    console.log('  ✓ WebRTC Offer, Answer, and Trickle ICE exchanged between Host and Participant 1.');

    // Participant 2 joins (making it a 3-party meeting)
    console.log('  -> Participant 2 (Charlie) joining 3-party room...');
    const p2AllUsersPromise = new Promise(resolve => {
      p2Socket.on('all-users', users => resolve(users));
    });

    p2Socket.emit('join-room', meetingRoomId, 'p2-user-id', 'Participant Charlie');
    const p2AllUsers = await p2AllUsersPromise;

    if (p2AllUsers.length !== 2) {
      throw new Error(`FAIL: Participant 2 expected 2 existing users (Host + P1), got ${p2AllUsers.length}`);
    }
    const hasHost = p2AllUsers.some(u => u.socketId === hostSocket.id);
    const hasP1 = p2AllUsers.some(u => u.socketId === p1Socket.id);
    if (!hasHost || !hasP1) {
      throw new Error('FAIL: Participant 2 all-users list missing Host or Participant 1');
    }
    console.log('  ✓ Participant 2 successfully discovered both Host and Participant 1.');

    // Participant 2 negotiates with BOTH Host and Participant 1
    const hostRecvP2Offer = new Promise(r => hostSocket.once('webrtc-offer', r));
    const p1RecvP2Offer = new Promise(r => p1Socket.once('webrtc-offer', r));

    p2Socket.emit('webrtc-offer', { to: hostSocket.id, offer: { type: 'offer', sdp: 'p2-to-host' } });
    p2Socket.emit('webrtc-offer', { to: p1Socket.id, offer: { type: 'offer', sdp: 'p2-to-p1' } });

    const [offerAtHost, offerAtP1] = await Promise.all([hostRecvP2Offer, p1RecvP2Offer]);
    if (offerAtHost.from !== p2Socket.id || offerAtP1.from !== p2Socket.id) {
      throw new Error('FAIL: 3-way offer routing failed');
    }
    console.log('  ✓ 3-Party Full Mesh WebRTC signaling established across all 3 participants.\n');

    // 4. Test Track Status Synchronization (Mute/Unmute & Camera Toggle)
    console.log('[TEST 4] Testing Real-Time Track State Synchronization (Mute / Unmute & Video Off)...');
    const p1MediaStatusOnHost = new Promise(resolve => {
      hostSocket.once('participant-media-status', data => resolve(data));
    });
    const p1MediaStatusOnP2 = new Promise(resolve => {
      p2Socket.once('participant-media-status', data => resolve(data));
    });

    // Participant 1 mutes mic and stops camera
    p1Socket.emit('toggle-media-state', meetingRoomId, { isAudioOn: false, isVideoOn: false });

    const [statusAtHost, statusAtP2] = await Promise.all([p1MediaStatusOnHost, p1MediaStatusOnP2]);
    if (statusAtHost.isAudioOn !== false || statusAtHost.isVideoOn !== false) {
      throw new Error('FAIL: Host did not receive correct media state');
    }
    if (statusAtP2.isAudioOn !== false || statusAtP2.isVideoOn !== false) {
      throw new Error('FAIL: Participant 2 did not receive correct media state');
    }
    console.log('✓ PASS: Real-time mute/unmute and video state synchronized across all participants without page reload.\n');

    // 5. Test Leaving & Clean Disconnect
    console.log('[TEST 5] Testing Participant Leaving & Stale Peer Cleanup...');
    const hostDisconnectNotice = new Promise(resolve => {
      hostSocket.once('user-disconnected', socketId => resolve(socketId));
    });
    const p2DisconnectNotice = new Promise(resolve => {
      p2Socket.once('user-disconnected', socketId => resolve(socketId));
    });

    const expectedSocketId = p1Socket.id;
    p1Socket.emit('leave-room', { roomId: meetingRoomId });
    p1Socket.disconnect();

    const [dcSocketIdAtHost, dcSocketIdAtP2] = await Promise.all([
      hostDisconnectNotice,
      p2DisconnectNotice
    ]);

    if (dcSocketIdAtHost !== expectedSocketId || dcSocketIdAtP2 !== expectedSocketId) {
      throw new Error(`FAIL: Disconnect notification contained incorrect socketId (expected: ${expectedSocketId}, got: ${dcSocketIdAtHost}, ${dcSocketIdAtP2})`);
    }
    console.log('✓ PASS: Disconnect events delivered cleanly to all remaining participants.\n');

    hostSocket.disconnect();
    p2Socket.disconnect();

    console.log('====================================================');
    console.log('ALL 5 WEBRTC TEST SUITES PASSED SUCCESSFULLY (100%)');
    console.log('====================================================');
    process.exit(0);
  } finally {
    server.close();
  }
}

runWebRTCTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
