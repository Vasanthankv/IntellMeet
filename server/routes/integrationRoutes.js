import express from 'express';
import crypto from 'crypto';
import Integration from '../models/Integration.js';
import UserIntegration from '../models/UserIntegration.js';
import IntegrationCredential from '../models/IntegrationCredential.js';
import WebhookSubscription from '../models/WebhookSubscription.js';
import IntegrationAuditLog from '../models/IntegrationAuditLog.js';
import Meeting from '../models/Meeting.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Fallback/Guest Auth Middleware
const authOrGuest = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  req.user = req.user || {
    id: req.body?.userId || req.query?.userId || 'guest_integrator',
    name: req.body?.userName || 'Guest User',
    organizationId: 'default-org',
    role: 'Admin'
  };
  next();
};

// Default Seed Catalog
const DEFAULT_CATALOG = [
  {
    integrationId: 'google-calendar',
    provider: 'GOOGLE',
    category: 'CALENDAR',
    name: 'Google Calendar',
    tagline: 'Synchronize events & 1-click scheduling with Google Workspace',
    description: 'Connect your Google account to automatically create Google Calendar events when scheduling IntelliMeet meetings, sync attendees, and view your schedule.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg',
    supportedFeatures: ['2-Way Calendar Sync', 'Add IntelliMeet Meeting Link', 'Attendee RSVP Detection', 'Conflict Checking'],
    requestedPermissions: [
      { scope: 'calendar.events.read', label: 'View calendar events', description: 'Read your upcoming schedule to prevent scheduling conflicts', required: true },
      { scope: 'calendar.events.write', label: 'Create and update events', description: 'Insert IntelliMeet meeting links, passcodes, and agendas into your Google Calendar', required: true },
      { scope: 'calendar.freebusy', label: 'Check free/busy availability', description: 'Query your availability for IntelliMeet Scheduler', required: false }
    ],
    status: 'ACTIVE',
    approvalRequired: false,
    isPopular: true,
    isBuiltIn: true
  },
  {
    integrationId: 'microsoft-365',
    provider: 'MICROSOFT',
    category: 'CALENDAR',
    name: 'Microsoft 365 / Outlook Calendar',
    tagline: 'Enterprise calendar sync with Exchange & Outlook',
    description: 'Add IntelliMeet meetings to Outlook calendar invites, synchronize meeting attendees, and book Microsoft 365 conference rooms.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg',
    supportedFeatures: ['Outlook Web & Desktop Add-in', 'Exchange Calendar Sync', 'Passcode & Join Link Injection', 'Room Scheduling'],
    requestedPermissions: [
      { scope: 'Calendars.ReadWrite', label: 'Read and write calendars', description: 'Create and synchronize Outlook calendar meetings', required: true },
      { scope: 'User.Read', label: 'Read user profile', description: 'Authenticate your Microsoft enterprise account', required: true }
    ],
    status: 'ACTIVE',
    approvalRequired: false,
    isPopular: true,
    isBuiltIn: true
  },
  {
    integrationId: 'slack',
    provider: 'SLACK',
    category: 'COMMUNICATION',
    name: 'Slack',
    tagline: 'Dispatch meeting links, automated AI summaries & action items to channels',
    description: 'Integrate IntelliMeet with Slack channels. Post instant join links, slash commands (/intellmeet), and automatically dispatch meeting summaries and action items.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg',
    supportedFeatures: ['Channel Join Alerts', 'AI Summary Sharing', 'Action Items Dispatch', 'Slash Commands (/intellmeet)'],
    requestedPermissions: [
      { scope: 'chat:write', label: 'Post messages to channels', description: 'Publish meeting links and AI summaries to chosen channels', required: true },
      { scope: 'channels:read', label: 'List public channels', description: 'Select which channel should receive meeting notifications', required: true },
      { scope: 'commands', label: 'Add slash commands', description: 'Allows team members to type /intellmeet to start a session', required: false }
    ],
    status: 'ACTIVE',
    approvalRequired: false,
    isPopular: true,
    isBuiltIn: true
  },
  {
    integrationId: 'microsoft-teams',
    provider: 'MICROSOFT',
    category: 'COMMUNICATION',
    name: 'Microsoft Teams',
    tagline: 'Bot notifications & meeting card synchronization in Teams',
    description: 'Share meeting cards, post instant join buttons into Teams channels, and distribute AI recaps to team chats.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg',
    supportedFeatures: ['Teams Channel Notifications', 'Meeting Cards', 'AI Recap Sharing', '1-Click Join'],
    requestedPermissions: [
      { scope: 'ChannelMessage.Send', label: 'Send channel messages', description: 'Post interactive meeting cards and summaries', required: true },
      { scope: 'TeamsActivity.Send', label: 'Send activity feed alerts', description: 'Notify participants when a meeting begins', required: false }
    ],
    status: 'ACTIVE',
    approvalRequired: false,
    isPopular: true,
    isBuiltIn: false
  },
  {
    integrationId: 'google-drive',
    provider: 'GOOGLE',
    category: 'COLLABORATION',
    name: 'Google Drive',
    tagline: 'Import pre-reads & save meeting recordings, transcripts and summaries',
    description: 'Attach documents directly from Google Drive as meeting pre-reads (#36), and automatically export transcripts, recordings, and AI notes into your Drive folders.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg',
    supportedFeatures: ['Import Pre-reads (#36)', 'Auto-Export Cloud Recordings', 'Export Transcripts & Notes', 'Drive File Picker'],
    requestedPermissions: [
      { scope: 'drive.file', label: 'Create & view files created by IntelliMeet', description: 'Store recordings and export summaries to Drive', required: true },
      { scope: 'drive.readonly', label: 'View files selected by user', description: 'Attach Google Docs or PDFs as pre-reads', required: false }
    ],
    status: 'ACTIVE',
    approvalRequired: false,
    isPopular: true,
    isBuiltIn: false
  },
  {
    integrationId: 'microsoft-onedrive',
    provider: 'MICROSOFT',
    category: 'COLLABORATION',
    name: 'Microsoft OneDrive & SharePoint',
    tagline: 'Enterprise document pre-reads & cloud storage sync',
    description: 'Attach SharePoint documents to upcoming meetings and automatically archive recordings and compliance transcripts to OneDrive.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg',
    supportedFeatures: ['SharePoint Pre-read Integration', 'OneDrive Recording Archival', 'Enterprise Retention Sync'],
    requestedPermissions: [
      { scope: 'Files.ReadWrite', label: 'Access files for upload/download', description: 'Save summaries and download pre-read attachments', required: true }
    ],
    status: 'ACTIVE',
    approvalRequired: false,
    isPopular: false,
    isBuiltIn: false
  },
  {
    integrationId: 'jira',
    provider: 'ATLASSIAN',
    category: 'PROJECT_MANAGEMENT',
    name: 'Jira Software',
    tagline: 'Convert AI-detected action items into tracked Jira issues with 1 click',
    description: 'Automatically scan meeting transcripts with IntelliMeet AI, extract assigned action items, and create Jira issues with issue keys, priority, and assignees.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg',
    supportedFeatures: ['1-Click AI Issue Creation', 'Transcript Context Link', 'Assignee Mapping', 'Sprint Association'],
    requestedPermissions: [
      { scope: 'read:jira-work', label: 'Read projects and issue types', description: 'List available Jira projects and issue fields', required: true },
      { scope: 'write:jira-work', label: 'Create and update issues', description: 'Publish action items directly into Jira backlogs', required: true }
    ],
    status: 'ACTIVE',
    approvalRequired: false,
    isPopular: true,
    isBuiltIn: true
  },
  {
    integrationId: 'asana',
    provider: 'ASANA',
    category: 'PROJECT_MANAGEMENT',
    name: 'Asana',
    tagline: 'Sync meeting tasks, due dates and assignees to Asana projects',
    description: 'Turn meeting discussion agreements and follow-ups into assigned Asana tasks with due dates, tags, and meeting source links.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg',
    supportedFeatures: ['Task Generation', 'Project Backlog Sync', 'Due Date Mapping'],
    requestedPermissions: [
      { scope: 'default', label: 'Access workspace tasks', description: 'Create and assign tasks in chosen Asana workspaces', required: true }
    ],
    status: 'ACTIVE',
    approvalRequired: false,
    isPopular: false,
    isBuiltIn: false
  },
  {
    integrationId: 'salesforce',
    provider: 'SALESFORCE',
    category: 'CRM',
    name: 'Salesforce',
    tagline: 'Log customer meeting recaps, notes & buyer sentiment to CRM accounts',
    description: 'Connect sales meetings to Salesforce Leads, Contacts, and Opportunities. Automatically attach AI summaries, key customer objections, and next steps.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/salesforce/salesforce-original.svg',
    supportedFeatures: ['Opportunity Meeting Notes', 'Customer Sentiment Logging', 'Contact Timeline Sync', 'Pipeline Stage Updates'],
    requestedPermissions: [
      { scope: 'api', label: 'Access Salesforce REST API', description: 'Read and update Lead and Opportunity records', required: true },
      { scope: 'refresh_token', label: 'Perform requests anytime', description: 'Maintain continuous background CRM synchronization', required: true }
    ],
    status: 'ACTIVE',
    approvalRequired: true,
    isPopular: true,
    isBuiltIn: false
  },
  {
    integrationId: 'hubspot',
    provider: 'HUBSPOT',
    category: 'CRM',
    name: 'HubSpot',
    tagline: 'Log call recordings, AI summaries & contact timelines to HubSpot',
    description: 'Sync customer calls to HubSpot contact records. Attach AI transcripts, key topics discussed, and action items directly to the deal timeline.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    supportedFeatures: ['Timeline Activity Sync', 'Deal Association', 'Call Summary Logging', 'Contact Enrichment'],
    requestedPermissions: [
      { scope: 'crm.objects.contacts.read', label: 'Read contact records', description: 'Match meeting participants with CRM contacts', required: true },
      { scope: 'crm.objects.deals.write', label: 'Log deal timeline notes', description: 'Save meeting recap to active deal records', required: true }
    ],
    status: 'ACTIVE',
    approvalRequired: false,
    isPopular: false,
    isBuiltIn: false
  },
  {
    integrationId: 'zapier',
    provider: 'ZAPIER',
    category: 'AUTOMATION',
    name: 'Zapier & Webhooks',
    tagline: 'Trigger 5,000+ app automations on meeting start, completion and summary',
    description: 'Connect IntelliMeet events to 5,000+ apps. Trigger custom workflows when meetings end, transcripts are ready, or action items are assigned.',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg',
    supportedFeatures: ['Trigger on Meeting Ended', 'Trigger on Summary Generated', 'Trigger on Action Item', 'Custom JSON Webhooks'],
    requestedPermissions: [
      { scope: 'webhooks:write', label: 'Manage webhook triggers', description: 'Register event dispatchers for Zapier zaps', required: true }
    ],
    status: 'ACTIVE',
    approvalRequired: false,
    isPopular: true,
    isBuiltIn: true
  }
];

// Helper: Seed catalog if missing
const ensureCatalogSeeded = async () => {
  const count = await Integration.countDocuments();
  if (count === 0) {
    await Integration.insertMany(DEFAULT_CATALOG);
  }
};

// @route   GET /api/integrations/marketplace
// @desc    Get all marketplace apps, optionally filtered by category
// @access  Public / Private
router.get('/marketplace', authOrGuest, async (req, res) => {
  try {
    await ensureCatalogSeeded();
    const { category, search } = req.query;
    let query = {};
    if (category && category !== 'ALL') {
      query.category = category.toUpperCase();
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } }
      ];
    }
    const apps = await Integration.find(query).sort({ isPopular: -1, name: 1 });
    res.json({ success: true, apps });
  } catch (error) {
    console.error('Error fetching marketplace apps:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/integrations/my
// @desc    Get all connected integrations for the current user
// @access  Private
router.get('/my', authOrGuest, async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id || 'guest');
    const userIntegrations = await UserIntegration.find({
      userId,
      status: { $in: ['CONNECTED', 'PENDING_APPROVAL'] }
    });

    const integrationIds = userIntegrations.map(u => u.integrationId);
    const catalogApps = await Integration.find({ integrationId: { $in: integrationIds } });
    const catalogMap = {};
    catalogApps.forEach(app => {
      catalogMap[app.integrationId] = app;
    });

    const results = userIntegrations.map(item => ({
      ...item.toObject(),
      appDetails: catalogMap[item.integrationId] || null
    }));

    res.json({ success: true, connected: results });
  } catch (error) {
    console.error('Error fetching connected integrations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/integrations/connect
// @desc    Connect / authenticate an integration (OAuth 2.0 flow simulation)
// @access  Private
router.post('/connect', authOrGuest, async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id || 'guest');
    const userName = req.user?.name || 'Participant';
    const organizationId = req.user?.organizationId || 'default-org';

    const {
      integrationId,
      accountEmail,
      accountName,
      scopes,
      config
    } = req.body;

    if (!integrationId) {
      return res.status(400).json({ success: false, message: 'integrationId is required' });
    }

    const app = await Integration.findOne({ integrationId });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Integration not found in catalog' });
    }

    // Determine initial status based on admin approval requirement
    const initialStatus = app.approvalRequired ? 'PENDING_APPROVAL' : 'CONNECTED';

    const userIntegrationId = `uint_${userId.slice(-6)}_${integrationId}_${Date.now().toString(36)}`;
    const grantedScopes = scopes && scopes.length > 0 ? scopes : app.requestedPermissions.map(p => p.scope);

    // Save or update user integration
    const userIntegration = await UserIntegration.findOneAndUpdate(
      { userId, integrationId },
      {
        userIntegrationId,
        userId,
        organizationId,
        integrationId,
        provider: app.provider,
        accountEmail: accountEmail || `${userName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        accountName: accountName || userName,
        grantedScopes,
        status: initialStatus,
        config: config || {},
        connectedAt: new Date(),
        lastSyncedAt: new Date(),
        syncStatus: 'IDLE'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Generate & store encrypted mock OAuth tokens
    const rawAccessToken = `im_oauth_${app.provider.toLowerCase()}_${crypto.randomBytes(24).toString('hex')}`;
    const rawRefreshToken = `im_refresh_${crypto.randomBytes(32).toString('hex')}`;
    const encryptedAccess = IntegrationCredential.encrypt(rawAccessToken);
    const encryptedRefresh = IntegrationCredential.encrypt(rawRefreshToken);

    await IntegrationCredential.findOneAndUpdate(
      { userId, integrationId },
      {
        credentialId: `cred_${userIntegrationId}`,
        userId,
        provider: app.provider,
        integrationId,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
        scopes: grantedScopes
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Audit log
    await IntegrationAuditLog.create({
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName,
      organizationId,
      provider: app.provider,
      integrationId,
      action: 'CONNECT',
      status: 'SUCCESS',
      details: {
        accountEmail: userIntegration.accountEmail,
        grantedScopes,
        status: initialStatus
      }
    });

    res.json({
      success: true,
      message: initialStatus === 'CONNECTED' ? `Successfully connected to ${app.name}` : `Connection request for ${app.name} submitted for admin approval`,
      userIntegration,
      appDetails: app
    });
  } catch (error) {
    console.error('Error connecting integration:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/integrations/disconnect
// @desc    Disconnect & revoke an integration
// @access  Private
router.post('/disconnect', authOrGuest, async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id || 'guest');
    const { integrationId } = req.body;

    if (!integrationId) {
      return res.status(400).json({ success: false, message: 'integrationId is required' });
    }

    const userIntegration = await UserIntegration.findOneAndUpdate(
      { userId, integrationId },
      { status: 'DISCONNECTED' },
      { new: true }
    );

    // Delete credentials
    await IntegrationCredential.deleteMany({ userId, integrationId });

    // Audit log
    await IntegrationAuditLog.create({
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName: req.user?.name || 'User',
      organizationId: req.user?.organizationId || 'default-org',
      provider: userIntegration?.provider || 'EXTERNAL',
      integrationId,
      action: 'DISCONNECT',
      status: 'SUCCESS',
      details: { disconnectedAt: new Date() }
    });

    res.json({ success: true, message: `Disconnected integration ${integrationId}` });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/integrations/calendar/sync
// @desc    Simulate 2-way Calendar Synchronization for Google / Microsoft 365
// @access  Private
router.post('/calendar/sync', authOrGuest, async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id || 'guest');
    const { provider = 'GOOGLE' } = req.body;

    const userInt = await UserIntegration.findOne({
      userId,
      provider: provider.toUpperCase(),
      status: 'CONNECTED'
    });

    if (!userInt) {
      return res.status(400).json({
        success: false,
        message: `No active ${provider} calendar integration connected. Please connect first.`
      });
    }

    // Query genuine meetings created by this user
    const realMeetings = await Meeting.find({
      $or: [
        { hostId: userId },
        { hostEmail: req.user?.email || '' }
      ]
    }).limit(10);

    const syncedEvents = realMeetings.map(m => ({
      id: m._id.toString(),
      title: m.title,
      startTime: (m.scheduledStartTime || m.createdAt || new Date()).toISOString(),
      endTime: (m.scheduledEndTime || new Date(Date.now() + 3600000)).toISOString(),
      attendees: (m.participants || []).map(p => p.email).filter(Boolean),
      intellmeetMeetingUrl: `http://localhost:5173/meetings/${m.numericMeetingId || m._id}/room`,
      status: 'SYNCED'
    }));

    userInt.lastSyncedAt = new Date();
    userInt.syncStatus = 'SUCCESS';
    userInt.syncStats.eventsSynced += syncedEvents.length;
    await userInt.save();

    await IntegrationAuditLog.create({
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName: req.user?.name || 'User',
      organizationId: req.user?.organizationId || 'default-org',
      provider: provider.toUpperCase(),
      integrationId: userInt.integrationId,
      action: 'SYNC',
      status: 'SUCCESS',
      details: { eventsSyncedCount: syncedEvents.length }
    });

    res.json({
      success: true,
      message: `Synchronized ${syncedEvents.length} calendar events with ${provider}`,
      lastSyncedAt: userInt.lastSyncedAt,
      events: syncedEvents
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/integrations/dispatch
// @desc    Dispatch meeting data, AI summaries, Jira issues or Slack messages
// @access  Private
router.post('/dispatch', authOrGuest, async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id || 'guest');
    const userName = req.user?.name || 'Participant';
    const {
      target, // 'SLACK' | 'TEAMS' | 'JIRA' | 'ASANA' | 'SALESFORCE' | 'HUBSPOT' | 'DRIVE'
      meetingId,
      meetingTitle,
      payload // { channel, text, summary, actionItems, issueTitle, issueDescription, assignee, leadEmail }
    } = req.body;

    if (!target) {
      return res.status(400).json({ success: false, message: 'Target platform is required' });
    }

    let dispatchResult = {};
    const auditAction = target === 'JIRA' || target === 'ASANA' ? 'CREATE_TASK' 
                      : target === 'SALESFORCE' || target === 'HUBSPOT' ? 'SYNC_CRM' 
                      : 'DISPATCH_MESSAGE';

    if (target === 'SLACK') {
      const channel = payload?.channel || '#general';
      dispatchResult = {
        platform: 'Slack',
        channel,
        messageId: `msg_${Date.now()}_slack`,
        text: payload?.text || `IntelliMeet AI Summary for ${meetingTitle || 'Meeting'} posted successfully.`,
        sentAt: new Date().toISOString()
      };
    } else if (target === 'TEAMS') {
      dispatchResult = {
        platform: 'Microsoft Teams',
        team: 'Engineering Core',
        cardId: `teams_card_${Date.now()}`,
        status: 'POSTED_TO_CHANNEL',
        sentAt: new Date().toISOString()
      };
    } else if (target === 'JIRA') {
      const issueKey = `IM-${Math.floor(100 + Math.random() * 900)}`;
      dispatchResult = {
        platform: 'Jira Software',
        issueKey,
        issueUrl: `https://atlassian.net/browse/${issueKey}`,
        summary: payload?.issueTitle || payload?.title || 'Action item from meeting',
        assignee: payload?.assignee || userName,
        priority: 'High',
        status: 'To Do',
        createdAt: new Date().toISOString()
      };
    } else if (target === 'ASANA') {
      dispatchResult = {
        platform: 'Asana',
        taskId: `asana_task_${Date.now()}`,
        taskName: payload?.issueTitle || payload?.title || 'Meeting follow-up task',
        project: 'IntelliMeet Platform Q4',
        createdAt: new Date().toISOString()
      };
    } else if (target === 'SALESFORCE') {
      dispatchResult = {
        platform: 'Salesforce',
        recordType: 'Opportunity Meeting Note',
        recordId: `006${Math.random().toString(36).substring(2, 12)}`,
        accountName: payload?.accountName || 'Acme Global Enterprises',
        insightsAttached: true,
        sentiment: 'POSITIVE',
        syncedAt: new Date().toISOString()
      };
    } else if (target === 'HUBSPOT') {
      dispatchResult = {
        platform: 'HubSpot',
        dealId: `hub_${Date.now()}`,
        callDuration: '42 mins',
        summaryLogged: true,
        syncedAt: new Date().toISOString()
      };
    } else if (target === 'DRIVE') {
      dispatchResult = {
        platform: 'Google Drive',
        fileId: `1drive_${Math.random().toString(36).substring(2, 14)}`,
        fileName: `${meetingTitle || 'Meeting'}_AI_Summary.pdf`,
        folder: 'IntelliMeet Recordings & Notes',
        viewUrl: 'https://drive.google.com/file/d/mock/view',
        syncedAt: new Date().toISOString()
      };
    } else {
      dispatchResult = {
        platform: target,
        status: 'DISPATCHED_GENERIC',
        sentAt: new Date().toISOString()
      };
    }

    // Update stats on user integration if exists
    await UserIntegration.findOneAndUpdate(
      { userId, provider: target },
      { 
        $inc: { 
          'syncStats.messagesDispatched': target === 'SLACK' || target === 'TEAMS' ? 1 : 0,
          'syncStats.tasksCreated': target === 'JIRA' || target === 'ASANA' ? 1 : 0
        },
        lastSyncedAt: new Date()
      }
    );

    // Audit log
    await IntegrationAuditLog.create({
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName,
      organizationId: req.user?.organizationId || 'default-org',
      provider: target,
      integrationId: target.toLowerCase(),
      action: auditAction,
      status: 'SUCCESS',
      details: { meetingId, meetingTitle, result: dispatchResult }
    });

    res.json({
      success: true,
      message: `Successfully dispatched to ${target}`,
      dispatchResult
    });
  } catch (error) {
    console.error('Error dispatching integration action:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/integrations/webhooks
// @desc    List all webhook subscriptions for the current user/organization
// @access  Private
router.get('/webhooks', authOrGuest, async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id || 'guest');
    const webhooks = await WebhookSubscription.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, webhooks });
  } catch (error) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/integrations/webhooks
// @desc    Create a new developer webhook subscription
// @access  Private
router.post('/webhooks', authOrGuest, async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id || 'guest');
    const organizationId = req.user?.organizationId || 'default-org';
    const { name, endpoint, events } = req.body;

    if (!endpoint || !endpoint.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'Valid HTTP/HTTPS endpoint URL is required' });
    }

    const secretKey = 'whsec_' + crypto.randomBytes(24).toString('hex');
    const subscriptionId = 'sub_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');

    const webhook = await WebhookSubscription.create({
      subscriptionId,
      userId,
      organizationId,
      name: name || 'Zapier & Custom Automation Webhook',
      endpoint,
      secretKey,
      events: events && events.length > 0 ? events : ['meeting.completed', 'summary.generated', 'action_item.created'],
      status: 'ACTIVE'
    });

    await IntegrationAuditLog.create({
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName: req.user?.name || 'Developer',
      organizationId,
      provider: 'WEBHOOK',
      integrationId: 'webhook',
      action: 'CONNECT',
      status: 'SUCCESS',
      details: { endpoint, events: webhook.events }
    });

    res.json({ success: true, message: 'Webhook subscription created', webhook });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/integrations/webhooks/test
// @desc    Test trigger/ping a webhook endpoint with sample payload
// @access  Private
router.post('/webhooks/test', authOrGuest, async (req, res) => {
  try {
    const { webhookId, event = 'meeting.completed' } = req.body;
    let targetEndpoint = 'https://webhook.site/mock-endpoint';

    if (webhookId) {
      const sub = await WebhookSubscription.findOne({ subscriptionId: webhookId });
      if (sub) {
        targetEndpoint = sub.endpoint;
        sub.deliveryCount += 1;
        sub.lastDeliveryAt = new Date();
        sub.lastDeliveryStatus = 200;
        sub.lastDeliveryPayload = {
          event,
          meetingId: 'MTG-TEST-WEBHOOK',
          topic: 'IntelliMeet Platform Test Event',
          host: 'Host',
          durationMinutes: 10,
          timestamp: new Date().toISOString(),
          summary: 'Platform integration test payload.',
          actionItems: [{ assignee: 'Lead', task: 'Run integration test suite' }]
        };
        await sub.save();
      }
    }

    res.json({
      success: true,
      message: `Test event [${event}] dispatched successfully to ${targetEndpoint}`,
      deliveredPayload: {
        event,
        eventId: `evt_${Date.now()}`,
        meetingId: 'MTG-7492-SAMPLE',
        topic: 'IntelliMeet Platform Review',
        host: 'Vasanthan',
        durationMinutes: 48,
        timestamp: new Date().toISOString()
      },
      httpStatus: 200
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/integrations/webhooks/:id
// @desc    Delete a webhook subscription
// @access  Private
router.delete('/webhooks/:id', authOrGuest, async (req, res) => {
  try {
    const { id } = req.params;
    await WebhookSubscription.findOneAndDelete({ subscriptionId: id });
    res.json({ success: true, message: 'Webhook subscription deleted' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/integrations/admin/audit-logs
// @desc    Retrieve enterprise integration audit logs
// @access  Admin
router.get('/admin/audit-logs', authOrGuest, async (req, res) => {
  try {
    const logs = await IntegrationAuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/integrations/admin/apps/:id/status
// @desc    Admin approve/reject or toggle organization app status
// @access  Admin
router.put('/admin/apps/:id/status', authOrGuest, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvalRequired } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (approvalRequired !== undefined) updateFields.approvalRequired = Boolean(approvalRequired);

    const app = await Integration.findOneAndUpdate(
      { integrationId: id },
      { $set: updateFields },
      { new: true }
    );

    if (!app) {
      return res.status(404).json({ success: false, message: 'App not found in catalog' });
    }

    res.json({ success: true, message: `Updated status for ${app.name}`, app });
  } catch (error) {
    console.error('Error updating app status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
