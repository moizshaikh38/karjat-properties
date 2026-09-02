export type SupportedLanguage = 'english' | 'hindi' | 'marathi' | 'hinglish' | 'mixed' | 'unknown';

/**
 * Detects the language of a given text using basic heuristics.
 * Defaults to 'unknown' for the AI to handle contextually if ambiguous.
 */
export const detectLanguage = (text: string): SupportedLanguage => {
  const lowerText = text.toLowerCase();
  
  // Marathi heuristics (Devanagari script + specific words)
  const marathiKeywords = ['pije', 'pahije', 'kuthe', 'mala', 'aahe', 'ahe', 'kiti', 'chhan'];
  const marathiRegex = /[\u0900-\u097F]/; // Matches Devanagari

  // Hindi heuristics (Hinglish words)
  const hindiKeywords = ['chahiye', 'kaha', 'kitna', 'hai', 'mujhe', 'kya', 'achha'];

  const hasDevanagari = marathiRegex.test(text);

  // If it's written in Devanagari, we can guess Hindi or Marathi based on words
  if (hasDevanagari) {
    if (marathiKeywords.some(w => lowerText.includes(w))) return 'marathi';
    return 'hindi'; // Default Devanagari to Hindi if no specific Marathi keywords
  }

  // Check Romanized words for Hinglish vs Marathi
  const hasHinglish = hindiKeywords.some(w => lowerText.includes(w));
  const hasMarathiRoman = marathiKeywords.some(w => lowerText.includes(w));
  
  if (hasHinglish && hasMarathiRoman) return 'mixed';
  if (hasHinglish) return 'hinglish';
  if (hasMarathiRoman) return 'marathi';

  // Basic English check
  const englishKeywords = ['looking', 'want', 'search', 'price', 'where', 'how much', 'is there'];
  if (englishKeywords.some(w => lowerText.includes(w))) return 'english';

  return 'unknown';
};
