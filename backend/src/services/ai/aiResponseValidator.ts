export const validateAIResponse = (text: string): { isValid: boolean, safeResponse: string, error?: string } => {
  let clean = text;
  
  // Rule 1: No leaking UUIDs (internal IDs)
  if (/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(clean)) {
    clean = clean.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '[REDACTED_ID]');
  }

  // Rule 2: No leaking internal system instructions or raw json markdown blocks
  if (clean.includes('```json') || clean.includes('{"intent"')) {
    return { isValid: false, safeResponse: '', error: 'AI leaked internal JSON/Chain-of-thought' };
  }

  // Rule 3: No dangerous guarantees or unauthorized discounts
  const dangerTerms = ['100% discount', 'guaranteed offer', 'free property', 'legal advice', 'guaranteed return'];
  if (dangerTerms.some(term => clean.toLowerCase().includes(term))) {
    return { isValid: false, safeResponse: '', error: 'AI made forbidden claims' };
  }

  // Check for unauthorized discount promises (e.g. "15% discount", "offer you a discount")
  if (/\b\d+%\s*discount\b/i.test(clean) || /\boffer you a \d+%\s*discount\b/i.test(clean)) {
    return { isValid: false, safeResponse: '', error: 'AI made unverified discount commitment' };
  }

  // Length check
  if (clean.length > 2500) {
    return { isValid: false, safeResponse: '', error: 'Response exceeded maximum length' };
  }

  return { isValid: true, safeResponse: clean.trim() };
};
