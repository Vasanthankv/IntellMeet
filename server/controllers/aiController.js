import { generateGeminiContent } from '../services/geminiService.js';
import Task from '../models/Task.js';

export const generateSummary = async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ success: false, message: 'No transcript provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Gemini API key is not configured on the server.' });
    }

    // Format the transcript into a readable string
    const formattedTranscript = transcript.map(t => `${t.sender}: ${t.text}`).join('\n');

    const prompt = `
      You are an executive AI assistant. Please analyze the following meeting transcript and generate a structured summary.
      Return ONLY a JSON object with the following structure (do not include markdown tags like \`\`\`json):
      {
        "summary": "A 2-3 sentence overview of the meeting",
        "keyPoints": ["Point 1", "Point 2", "Point 3"],
        "actionItems": ["Action 1", "Action 2"],
        "decisions": ["Decision 1"]
      }

      Here is the transcript:
      ${formattedTranscript}
    `;

    const { text } = await generateGeminiContent(prompt);
    
    // Robustly extract and parse JSON from Gemini response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini response did not contain a valid JSON object.');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);

    // Automatically generate Tasks from action items safely
    if (parsedData.actionItems && Array.isArray(parsedData.actionItems) && req.user) {
      try {
        const rawUserId = req.user._id || req.user.id;
        const isValidId = rawUserId && typeof rawUserId === 'string' && /^[0-9a-fA-F]{24}$/.test(rawUserId);
        
        if (isValidId) {
          const taskPromises = parsedData.actionItems.map(async (actionItem) => {
            const title = typeof actionItem === 'string' ? actionItem : (actionItem.task || actionItem.title || JSON.stringify(actionItem));
            const newTask = new Task({
              title,
              description: 'Auto-generated from IntellMeet AI Summary',
              status: 'todo',
              priority: 'Medium',
              user: rawUserId
            });
            return newTask.save().catch(e => console.warn('Task save warning:', e.message));
          });
          await Promise.all(taskPromises);
        }
      } catch (taskErr) {
        console.warn('Auto task creation notice:', taskErr.message);
      }
    }

    return res.json({ success: true, data: parsedData });

  } catch (error) {
    console.error('Gemini AI Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to generate AI summary', error: error.message });
  }
};

