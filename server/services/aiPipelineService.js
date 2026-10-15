import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recording } from '../models/Recording.js';
import { MeetingTranscript } from '../models/MeetingTranscript.js';
import { MeetingSummary } from '../models/MeetingSummary.js';
import Task from '../models/Task.js';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export const AIPipelineService = {
  /**
   * Run the post-meeting intelligence pipeline for a completed recording or meeting
   * @param {string} meetingId 
   * @param {string} recordingId 
   * @param {string} meetingTitle 
   */
  async processPostMeetingIntelligence(meetingId, recordingId = null, meetingTitle = 'IntellMeet Session') {
    console.log(`[AIPipeline] Starting post-meeting intelligence for meeting: ${meetingId}`);

    try {
      // 1. Fetch transcript segments
      let transcriptDoc = await MeetingTranscript.findOne({ meetingId }).sort({ createdAt: -1 });
      if (!transcriptDoc) {
        transcriptDoc = await MeetingTranscript.create({
          meetingId,
          meetingTitle,
          status: 'COMPLETED',
          segments: [],
          aiSummary: {}
        });
      }

      let segments = transcriptDoc.segments || [];

      // If no segments were captured during meeting
      if (segments.length === 0) {
        console.log(`[AIPipeline] No live transcript segments found for ${meetingId}. Setting truthful empty state.`);
        let summaryDoc = await MeetingSummary.findOne({ meetingId }).sort({ createdAt: -1 });
        if (!summaryDoc) {
          summaryDoc = new MeetingSummary({ meetingId, meetingTitle });
        }
        summaryDoc.status = 'COMPLETED';
        summaryDoc.overview = '';
        summaryDoc.keyDiscussionPoints = [];
        summaryDoc.decisions = [];
        summaryDoc.actionItems = [];
        summaryDoc.questions = [];
        await summaryDoc.save();

        if (recordingId) {
          await Recording.findOneAndUpdate(
            { recordingId },
            {
              processingStatus: 'COMPLETED',
              aiMetadata: {
                transcriptId: transcriptDoc._id.toString(),
                summary: '',
                decisions: [],
                actionItems: []
              }
            }
          );
        }
        return { success: true, message: 'No transcript segments recorded for this meeting', summary: summaryDoc };
      }

      // 2. Generate structured AI Summary via Gemini from REAL segments
      const formattedTranscript = segments.map((s, idx) => {
        const mins = Math.floor((s.startTime || idx * 10) / 60);
        const secs = String(Math.floor((s.startTime || idx * 10) % 60)).padStart(2, '0');
        return `[${mins}:${secs}] ${s.speakerName || 'Speaker'}: ${s.text}`;
      }).join('\n');

      let aiResult = null;

      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const prompt = `
You are an executive corporate meeting intelligence assistant for IntellMeet.
Meeting Title: ${meetingTitle}
Meeting ID: ${meetingId}

Analyze this actual meeting transcript and produce a factual, high-value summary based strictly on what was spoken:
${formattedTranscript}

Return ONLY valid JSON with this exact schema (no markdown, no backticks, raw JSON):
{
  "overview": "A 2-4 sentence executive overview of the meeting based strictly on the transcript",
  "keyDiscussionPoints": ["Discussion point 1", "Discussion point 2"],
  "decisions": [
    {
      "description": "Clear statement of actual decision made",
      "decidedBy": ["Name"]
    }
  ],
  "actionItems": [
    {
      "task": "Actionable task mentioned",
      "assignee": "Responsible person if mentioned or Unassigned",
      "dueDate": "Deadline if mentioned or null"
    }
  ],
  "openQuestions": ["Unresolved question mentioned"]
}
`;

          const response = await model.generateContent(prompt);
          const rawText = response.response?.text() || '';
          const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          aiResult = JSON.parse(cleanedJson);
          console.log('[AIPipeline] Gemini summary generated successfully from real transcript.');
        } catch (geminiErr) {
          console.warn('[AIPipeline] Gemini generation warning, synthesizing factual overview from real text:', geminiErr.message);
        }
      }

      if (!aiResult) {
        // Honest summary from real segments without hallucinating names
        const sampleText = segments.slice(0, 3).map(s => s.text).join(' ');
        aiResult = {
          overview: sampleText ? `Summary based on recorded discussion: ${sampleText.slice(0, 200)}...` : '',
          keyDiscussionPoints: segments.slice(0, 5).map(s => s.text.slice(0, 100)),
          decisions: [],
          actionItems: [],
          openQuestions: []
        };
      }

      // 3. Save into MeetingSummary model
      let summaryDoc = await MeetingSummary.findOne({ meetingId }).sort({ createdAt: -1 });
      if (!summaryDoc) {
        summaryDoc = new MeetingSummary({ meetingId, meetingTitle });
      }

      summaryDoc.status = 'COMPLETED';
      summaryDoc.overview = aiResult.overview;
      summaryDoc.keyDiscussionPoints = aiResult.keyDiscussionPoints || [];
      summaryDoc.decisions = (aiResult.decisions || []).map(d => ({
        decisionId: 'dec_' + Math.random().toString(36).substring(2, 7),
        description: typeof d === 'string' ? d : d.description,
        decidedBy: Array.isArray(d.decidedBy) ? d.decidedBy : ['Team']
      }));
      summaryDoc.actionItems = (aiResult.actionItems || []).map(a => ({
        actionId: 'act_' + Math.random().toString(36).substring(2, 7),
        task: a.task,
        assignee: a.assignee || 'Team Member',
        dueDate: a.dueDate || 'Next Sprint',
        completed: false
      }));
      summaryDoc.questions = (aiResult.openQuestions || []).map(q => ({
        question: typeof q === 'string' ? q : q.question || '',
        status: 'UNRESOLVED'
      }));

      await summaryDoc.save();

      // 4. Update Transcript AI summary fields
      transcriptDoc.aiSummary = {
        executiveSummary: aiResult.overview,
        keyDecisions: summaryDoc.decisions.map(d => d.description),
        actionItems: summaryDoc.actionItems.map(a => `${a.task} (${a.assignee})`),
        generatedAt: new Date()
      };
      await transcriptDoc.save();

      // 5. Update Recording aiMetadata if recordingId provided
      if (recordingId) {
        const recording = await Recording.findOne({ recordingId });
        if (recording) {
          recording.aiMetadata = {
            transcriptId: transcriptDoc._id.toString(),
            summary: aiResult.overview,
            decisions: summaryDoc.decisions.map(d => d.description),
            actionItems: summaryDoc.actionItems.map(a => ({
              task: a.task,
              assignee: a.assignee,
              dueDate: a.dueDate,
              completed: false
            }))
          };
          recording.processingStatus = 'COMPLETED';
          await recording.save();
        }
      }

      console.log(`[AIPipeline] Post-meeting intelligence completed successfully for meeting ${meetingId}.`);
      return { success: true, summary: summaryDoc, transcript: transcriptDoc };
    } catch (pipelineErr) {
      console.error('[AIPipeline] Error processing post-meeting intelligence:', pipelineErr);
      if (recordingId) {
        await Recording.findOneAndUpdate(
          { recordingId },
          { processingStatus: 'FAILED' }
        ).catch(() => {});
      }
      return { success: false, error: pipelineErr.message };
    }
  }
};

export default AIPipelineService;
