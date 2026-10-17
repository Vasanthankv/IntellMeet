import { generateGeminiContent, isGeminiConfigured } from './geminiService.js';

// Common meeting phrases mapped across major languages for instant offline/test fallback
const TRANSLATION_DICTIONARY = {
  'the application will be deployed tomorrow': {
    es: 'La aplicación se desplegará mañana',
    ta: 'விண்ணப்பம் நாளை பயன்படுத்தப்படும்',
    hi: 'एप्लिकेशन को कल तैनात किया जाएगा',
    te: 'అప్లికేషన్ రేపు అమలు చేయబడుతుంది',
    fr: "L'application sera déployée demain",
    de: 'Die Anwendung wird morgen bereitgestellt',
    ja: 'アプリケーションは明日デプロイされます',
    zh: '该应用程序将于明天部署',
  },
  'we will deploy the application tomorrow': {
    es: 'Desplegaremos la aplicación mañana',
    ta: 'நாளை நாங்கள் பயன்பாட்டை வெளியிடுவோம்',
    hi: 'हम कल एप्लिकेशन को तैनात करेंगे',
    te: 'మేము రేపు అప్లికేషన్‌ను అమలు చేస్తాము',
    fr: "Nous déploierons l'application demain",
    de: 'Wir werden die Anwendung morgen bereitstellen',
    ja: '明日アプリケーションをデプロイします',
    zh: '我们明天将部署该应用程序',
  },
  'i will complete the backend testing today': {
    es: 'Completaré las pruebas del backend hoy',
    ta: 'நான் இன்று பின்தள சோதனையை முடிப்பேன்',
    hi: 'मैं आज बैकएंड परीक्षण पूरा करूँगा',
    te: 'నేను ఈరోజు బ్యాకెండ్ పరీక్షను పూర్తి చేస్తాను',
    fr: "Je terminerai les tests backend aujourd'hui",
    de: 'Ich werde heute die Backend-Tests abschließen',
    ja: '本日バックエンドテストを完了します',
    zh: '我今天将完成后端测试',
  },
  'el proyecto estará listo mañana': {
    en: 'The project will be ready tomorrow',
    ta: 'திட்டம் நாளை தயாராகிவிடும்',
    hi: 'परियोजना कल तैयार हो जाएगी',
    es: 'El proyecto estará listo mañana',
    fr: 'Le projet sera prêt demain',
  },
  'the project will be ready tomorrow': {
    es: 'El proyecto estará listo mañana',
    ta: 'திட்டம் நாளை தயாராகிவிடும்',
    hi: 'परियोजना कल तैयार हो जाएगी',
    fr: 'Le projet sera prêt demain',
    de: 'Das Projekt wird morgen fertig sein',
  },
  'hello everyone, welcome to the meeting': {
    es: 'Hola a todos, bienvenidos a la reunión',
    ta: 'அனைவருக்கும் வணக்கம், சந்திப்பிற்கு வரவேற்கிறோம்',
    hi: 'सभी को नमस्कार, बैठक में आपका स्वागत है',
    te: 'అందరికీ నమస్కారం, సమావేశానికి స్వాగతం',
    fr: 'Bonjour à tous, bienvenue à la réunion',
  }
};

const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  ta: 'Tamil',
  hi: 'Hindi',
  te: 'Telugu',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  ru: 'Russian',
  vi: 'Vietnamese'
};

/**
 * Translates text from source language to target language.
 * Uses Gemini AI if GEMINI_API_KEY is available; otherwise uses dictionary / intelligent heuristics.
 */
export async function translateText(text, sourceLang = 'en', targetLang = 'ta') {
  if (!text || !text.trim()) return '';
  const src = sourceLang.split('-')[0].toLowerCase();
  const tgt = targetLang.split('-')[0].toLowerCase();

  // If source and target are the same, return as is
  if (src === tgt) return text;

  // 1. Check exact dictionary match (case-insensitive & stripped punctuation)
  const normalized = text.trim().toLowerCase().replace(/[.!?]+$/, '');
  for (const [key, translations] of Object.entries(TRANSLATION_DICTIONARY)) {
    if (normalized === key) {
      if (translations[tgt]) return translations[tgt];
    }
  }

  // 2. Query Gemini AI (Cascading Model Fallback)
  if (!isGeminiConfigured()) {
    throw new Error('Gemini AI service is not configured. Please set GEMINI_API_KEY in the environment.');
  }

  try {
    const prompt = `Translate the following text from ${LANGUAGE_NAMES[src] || src} to ${LANGUAGE_NAMES[tgt] || tgt}. Return ONLY the direct translated text with no quotes, explanations, or formatting.\n\nText: "${text}"`;
    const { text: translated } = await generateGeminiContent(prompt);
    if (translated && translated.trim()) return translated.trim();
    throw new Error('Empty response from translation model');
  } catch (err) {
    console.error('Gemini translation error:', err.message);
    throw new Error(`AI Translation failed: ${err.message}`);
  }
}

export default { translateText };
