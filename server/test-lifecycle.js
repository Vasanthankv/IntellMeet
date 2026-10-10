// Native global fetch used in Node.js 18+

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Part 40 Complete Meeting Lifecycle Test Suite...');

  // 0. Register / Login test user
  const userEmail = `lifecycle_test_${Date.now()}@example.com`;
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
  const testMeetingId = 'test-lifecycle-' + Date.now();
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
      date: '2026-10-06',
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
  if (lifecycleData.currentStage !== 'SCHEDULED') {
    throw new Error(`Expected SCHEDULED stage, got ${lifecycleData.currentStage}`);
  }

  // 3. Test Stage Transition: SCHEDULED -> WAITING_TO_START -> LIVE
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
  if (liveData.currentStage !== 'LIVE') {
    throw new Error('Failed to transition to LIVE');
  }

  // 4. Test Stage Transition: LIVE -> ENDING
  console.log('\n4️⃣ Testing PUT /api/meetings/:meetingId/lifecycle/stage (Transition to ENDING)');
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

  // 5. Test Trigger Post-Meeting Pipeline
  console.log('\n5️⃣ Testing POST /api/meetings/:meetingId/lifecycle/trigger-pipeline');
  const pipelineRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/lifecycle/trigger-pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const pipelineData = await pipelineRes.json();
  console.log('Pipeline execution status:', pipelineData.success, 'Stage:', pipelineData.stage);
  console.log('Pipeline sub-statuses:', pipelineData.pipeline);
  console.log('Assets ready:', pipelineData.assetsReady);
  if (pipelineData.stage !== 'COMPLETED' || pipelineData.pipeline.aiSummary !== 'COMPLETED') {
    throw new Error('Pipeline failed to complete');
  }

  // 6. Test Meeting Knowledge Layer Query & Full-Text Search
  console.log('\n6️⃣ Testing GET /api/meetings/:meetingId/knowledge (and search query)');
  const knowledgeRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/knowledge`);
  const knowledgeData = await knowledgeRes.json();
  console.log('Knowledge document exists:', knowledgeData.success);
  console.log('Decisions count:', knowledgeData.knowledge?.decisions?.length);
  console.log('Action items count:', knowledgeData.knowledge?.actionItems?.length);
  console.log('Smart chapters count:', knowledgeData.knowledge?.smartChapters?.length);

  // Test keyword search
  const searchRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/knowledge?q=Architecture`);
  const searchData = await searchRes.json();
  console.log('Search query result agenda count:', searchData.knowledge?.agendaSummary?.length);
  console.log('Search query result decisions count:', searchData.knowledge?.decisions?.length);

  // 7. Test Adding Action Item in Knowledge Layer
  console.log('\n7️⃣ Testing POST /api/meetings/:meetingId/knowledge/action-item');
  const addActionRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/knowledge/action-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: 'Deploy Part 40 Lifecycle Engine to Staging',
      owner: 'DevOps Lead',
      priority: 'HIGH'
    })
  });
  const addActionData = await addActionRes.json();
  console.log('Action item added:', addActionData.success, 'Task:', addActionData.actionItem?.task);
  const actionId = addActionData.actionItem?.actionId;

  // 8. Test Updating Action Item Status
  if (actionId) {
    console.log(`\n8️⃣ Testing PUT /api/meetings/:meetingId/knowledge/action-item/${actionId}`);
    const updateActionRes = await fetch(`${BASE_URL}/meetings/${testMeetingId}/knowledge/action-item/${actionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'COMPLETED'
      })
    });
    const updateActionData = await updateActionRes.json();
    console.log('Action item updated status:', updateActionData.actionItem?.status);
    if (updateActionData.actionItem?.status !== 'COMPLETED') {
      throw new Error('Action item status update failed');
    }
  }

  console.log('\n========================================================');
  console.log('🎉 ALL PART 40 LIFECYCLE BACKEND TESTS PASSED CLEANLY! 🎉');
  console.log('========================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
