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
    
    // Clean up potential markdown formatting
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(cleanedText);


    // Automatically generate Tasks from action items!
    if (parsedData.actionItems && parsedData.actionItems.length > 0 && req.user) {
      const taskPromises = parsedData.actionItems.map(async (actionText) => {
        const newTask = new Task({
          title: actionText,
          description: 'Auto-generated from IntellMeet AI Summary',
          status: 'todo',
          priority: 'Medium',
          user: req.user._id
        });
        return newTask.save();
      });
      await Promise.all(taskPromises);
    }

    return res.json({ success: true, data: parsedData });

  } catch (error) {
    console.error('Gemini AI Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate AI summary' });
  }
};
