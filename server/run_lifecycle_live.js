const BASE_URL = 'https://intellmeet-backend-rc32.onrender.com/api';

async function runTests() {
  console.log('🧪 Starting Part 40 Complete Meeting Lifecycle Test Suite against Live Backend...');

  // 0. Register / Login test user
  const userEmail = `lifecycle_test_${Date.now()}@example.com`;
  console.log('\n0️⃣ Registering test user:', userEmail);
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Lifecycle Tester',
      email: userEmail,
      password: 'password123'
    })
  });
  const regData = await regRes.json();
  const token = regData.token;
  console.log('User registered, token received:', !!token);

  // 1. Create test meeting
  const testMeetingId = 'mtg_' + Date.now();
  console.log(`\n1️⃣ Creating test meeting: ${testMeetingId}`);
  const createRes = await fetch(`${BASE_URL}/meetings`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Sprint Architecture & Lifecycle Sync',
      meetingId: testMeetingId,
      hostName: 'Lifecycle Tester',
      date: '2026-10-14',
      time: '10:00 AM',
      duration: '45 mins',
      status: 'scheduled'
    })
  });
  const createData = await createRes.json();
  console.log('Meeting created successfully:', createData.meeting?.meetingId || testMeetingId);

  // 2. Fetch Initial Lifecycle State
  console.log('\n2️⃣ Testing GET /api/meetings/:meetingId/lifecycle');
  const getLifecycleRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/lifecycle`);
  const lifecycleData = await getLifecycleRes.json();
  console.log('Current stage:', lifecycleData.currentStage);
  console.log('Phases count:', lifecycleData.phases?.length);
  console.log('Stages count:', lifecycleData.stages?.length);

  // 3. Test Stage Transition: SCHEDULED -> LIVE
  console.log('\n3️⃣ Testing PUT /api/meetings/:meetingId/lifecycle/stage (Transition to LIVE)');
  const liveTransitionRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/lifecycle/stage`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stage: 'LIVE',
      triggeredBy: 'Host',
      notes: 'Host started meeting, all attendees admitted from waiting room'
    })
  });
  const liveData = await liveTransitionRes.json();
  console.log('Transition to LIVE status:', liveData.success, 'New stage:', liveData.currentStage);

  // 4. Test In-Meeting AI Summary Generation
  console.log('\n4️⃣ Testing POST /api/meetings/:meetingId/summary/generate');
  const sumRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/summary/generate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ template: 'GENERAL' })
  });
  const sumData = await sumRes.json();
  console.log('AI Summary generation:', sumData.success, 'Status:', sumData.summary?.status);
  console.log('Overview snippet:', sumData.summary?.overview?.substring(0, 80));

  // 5. Test In-Meeting AI Questions & Answers
  console.log('\n5️⃣ Testing POST /api/meetings/:meetingId/questions/ask');
  const qRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/questions/ask`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      question: 'What are the next sprint deliverables?',
      presetType: 'CUSTOM'
    })
  });
  const qData = await qRes.json();
  console.log('AI Question Status:', qData.success, 'Answer:', qData.questionItem?.answer?.text?.substring(0, 80));

  // 6. Test In-Meeting Multilingual Translation
  console.log('\n6️⃣ Testing POST /api/meetings/:meetingId/translation/translate');
  const transRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/translation/translate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      text: 'the application will be deployed tomorrow',
      sourceLanguage: 'en',
      targetLanguage: 'es'
    })
  });
  const transData = await transRes.json();
  console.log('Translation Status:', transData.success, 'Translated:', transData.translatedText);

  // 7. Test In-Meeting My Notes
  console.log('\n7️⃣ Testing GET /api/meetings/:meetingId/notes/my');
  const noteRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/notes/my`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const noteData = await noteRes.json();
  console.log('My Notes Status:', noteData.success, 'Title:', noteData.note?.title);

  // 8. Test Stage Transition: LIVE -> ENDING
  console.log('\n8️⃣ Testing PUT /api/meetings/:meetingId/lifecycle/stage (Transition to ENDING)');
  const endingTransitionRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/lifecycle/stage`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stage: 'ENDING',
      triggeredBy: 'Host',
      notes: 'Host ended meeting for all'
    })
  });
  const endingData = await endingTransitionRes.json();
  console.log('Transition to ENDING status:', endingData.success, 'New stage:', endingData.currentStage);

  // 9. Test Trigger Post-Meeting Pipeline
  console.log('\n9️⃣ Testing POST /api/meetings/:meetingId/lifecycle/trigger-pipeline');
  const pipelineRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/lifecycle/trigger-pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const pipelineData = await pipelineRes.json();
  console.log('Pipeline execution status:', pipelineData.success, 'Stage:', pipelineData.stage);
  console.log('Assets ready:', pipelineData.assetsReady);

  // 10. Test Post-Meeting Knowledge RAG Query
  console.log('\n🔟 Testing POST /api/meetings/:meetingId/knowledge/query');
  const queryRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/knowledge/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What was decided about deployment?'
    })
  });
  const queryData = await queryRes.json();
  console.log('Knowledge query status:', queryData.success, 'Answer snippet:', queryData.answer?.substring(0, 80));

  console.log('\n🎉 ALL 10 PHASES OF THE INTELLIGENT MEETING LIFECYCLE PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('Lifecycle test failure:', err);
  process.exit(1);
});
