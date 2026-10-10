const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting Part 38: Device & Network Adaptation Tests ---');
  let passed = 0;
  let total = 0;

  const assert = (condition, name) => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
    }
  };

  try {
    const testMeetingId = `test_mtg_${Date.now()}`;
    const testSessionId = `sess_${Date.now()}`;
    const testUserId = `user_${Date.now()}`;

    // 1. Register Device Session (Section 38.1, 38.2, 38.3, 38.18)
    const devRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/adaptation/device-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        meetingId: testMeetingId,
        userId: testUserId,
        userName: 'Alex Chen',
        deviceType: 'DESKTOP',
        operatingSystem: 'Windows 11 Pro',
        browser: 'Chrome 122.0',
        cameraAvailable: true,
        microphoneAvailable: true,
        speakerAvailable: true,
        batteryLevel: 94,
        isCharging: true,
        lowBandwidthMode: 'AUTO',
        participationMode: 'AUDIO_VIDEO'
      })
    });
    const devData = await devRes.json();
    assert(devData.success === true, 'Device session registered successfully');
    assert(devData.session?.deviceType === 'DESKTOP', 'Device type is DESKTOP');
    assert(devData.session?.operatingSystem === 'Windows 11 Pro', 'Operating system detected');
    assert(devData.session?.batteryLevel === 94, 'Battery level reported');

    // 2. Submit Network Quality Telemetry - Good (Section 38.7, 38.18)
    const netRes1 = await fetch(`${BASE_URL}/meetings/${testMeetingId}/adaptation/network-quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        userId: testUserId,
        userName: 'Alex Chen',
        meetingId: testMeetingId,
        bandwidthUp: 4.8,
        bandwidthDown: 12.5,
        latency: 42,
        jitter: 6,
        packetLoss: 0.1,
        connectionType: 'WIFI'
      })
    });
    const netData1 = await netRes1.json();
    assert(netData1.success === true, 'Network quality telemetry recorded');
    assert(netData1.quality === 'EXCELLENT', 'Low latency (<80ms) and low loss (<1%) classified as EXCELLENT');

    // 3. Submit Network Quality Telemetry - Unstable / Fair
    const netRes2 = await fetch(`${BASE_URL}/meetings/${testMeetingId}/adaptation/network-quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `sess_p2_${Date.now()}`,
        userId: 'user_p2',
        userName: 'Priya Sharma',
        meetingId: testMeetingId,
        bandwidthUp: 0.8,
        bandwidthDown: 1.4,
        latency: 220,
        jitter: 24,
        packetLoss: 4.5,
        connectionType: 'CELLULAR_4G'
      })
    });
    const netData2 = await netRes2.json();
    assert(netData2.success === true, 'Second participant network telemetry recorded');
    assert(netData2.quality === 'FAIR', 'Degraded connection (220ms, 4.5% loss) classified as FAIR');

    // 4. Submit Network Quality Telemetry - Critical (Audio Priority required)
    const netRes3 = await fetch(`${BASE_URL}/meetings/${testMeetingId}/adaptation/network-quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `sess_p3_${Date.now()}`,
        userId: 'user_p3',
        userName: 'Divya Nair',
        meetingId: testMeetingId,
        bandwidthUp: 0.18,
        bandwidthDown: 0.35,
        latency: 480,
        jitter: 55,
        packetLoss: 14.2,
        connectionType: 'CELLULAR_4G'
      })
    });
    const netData3 = await netRes3.json();
    assert(netData3.success === true, 'Critical network telemetry recorded');
    assert(netData3.quality === 'CRITICAL', 'Severe latency (>450ms) and high loss (>12%) classified as CRITICAL');

    // 5. Update Media Quality Profile (Section 38.6, 38.18)
    const mediaRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/adaptation/media-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        meetingId: testMeetingId,
        userId: testUserId,
        videoEnabled: true,
        videoResolution: '1080p',
        frameRate: 30,
        audioPriority: false,
        screenShareQuality: 'HD',
        effectsReduced: false
      })
    });
    const mediaData = await mediaRes.json();
    assert(mediaData.success === true, 'Media quality profile updated');
    assert(mediaData.profile?.videoResolution === '1080p', 'Video resolution set to 1080p HD');
    assert(mediaData.profile?.frameRate === 30, 'Frame rate set to 30fps');

    // 6. Audio-Only Profile adaptation for critical network user (Section 38.4, 38.9)
    const mediaResAudioOnly = await fetch(`${BASE_URL}/meetings/${testMeetingId}/adaptation/media-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `sess_p3_${Date.now()}`,
        meetingId: testMeetingId,
        userId: 'user_p3',
        videoEnabled: false,
        videoResolution: 'none',
        frameRate: 0,
        audioPriority: true,
        screenShareQuality: 'LOW_BANDWIDTH',
        effectsReduced: true
      })
    });
    const mediaDataAudioOnly = await mediaResAudioOnly.json();
    assert(mediaDataAudioOnly.success === true, 'Audio-only media profile adapted for low bandwidth user');
    assert(mediaDataAudioOnly.profile?.audioPriority === true, 'Audio priority enabled');
    assert(mediaDataAudioOnly.profile?.videoEnabled === false, 'Video disabled for bandwidth preservation');

    // 7. Get Meeting Adaptation Analytics (Section 38.20 & #34 Analytics integration)
    const analyticsRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/adaptation/analytics`);
    const analyticsData = await analyticsRes.json();
    console.log('DEBUG analyticsData:', JSON.stringify(analyticsData));
    assert(analyticsData.success === true, 'Meeting adaptation analytics retrieved successfully');
    assert(analyticsData.meetingId === testMeetingId, 'Analytics match requested meetingId');
    assert(analyticsData.networkQualityBreakdown?.EXCELLENT >= 1, 'Analytics reflects EXCELLENT network count');
    assert(analyticsData.networkQualityBreakdown?.CRITICAL >= 1, 'Analytics reflects CRITICAL network count');
    assert(analyticsData.audioOnlyCount >= 1, 'Analytics tracks audio-only participation count');
    assert(analyticsData.deviceBreakdown?.DESKTOP >= 1, 'Analytics tracks desktop client count');

    console.log(`\nResults: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);

    if (passed === total) {
      console.log('🎉 All Part 38 Backend Tests Passed Successfully!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
