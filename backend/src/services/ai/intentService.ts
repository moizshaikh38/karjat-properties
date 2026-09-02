export type IntentType = 
  | 'PROPERTY_SEARCH'
  | 'PROPERTY_DETAILS'
  | 'PRICE_INQUIRY'
  | 'LOCATION_INQUIRY'
  | 'AMENITIES_INQUIRY'
  | 'AVAILABILITY_INQUIRY'
  | 'BROCHURE_REQUEST'
  | 'PHOTO_REQUEST'
  | 'VIDEO_REQUEST'
  | 'SITE_VISIT_REQUEST'
  | 'CONTACT_AGENT'
  | 'CALL_REQUEST'
  | 'NEGOTIATION'
  | 'LOAN_QUERY'
  | 'GENERAL_QUERY'
  | 'GREETING'
  | 'THANK_YOU'
  | 'HUMAN_REQUEST'
  | 'UNKNOWN';

/**
 * Determines primary intent using fast heuristic keywords.
 * If unknown, relies on the LLM to process contextually.
 */
export const detectPrimaryIntent = (text: string): IntentType => {
  const t = text.toLowerCase();

  if (t.match(/\b(hi|hello|hey|namaste)\b/)) return 'GREETING';
  if (t.match(/\b(thanks|thank you|dhanyawad)\b/)) return 'THANK_YOU';
  
  if (t.match(/\b(human|agent|person|call|speak to someone|contact|number)\b/)) {
    if (t.includes('call')) return 'CALL_REQUEST';
    if (t.includes('agent') || t.includes('human') || t.includes('someone')) return 'HUMAN_REQUEST';
    return 'CONTACT_AGENT';
  }

  if (t.match(/\b(visit|site visit|come and see|dekhna hai)\b/)) return 'SITE_VISIT_REQUEST';
  
  if (t.match(/\b(brochure|pdf|details|send details)\b/)) return 'BROCHURE_REQUEST';
  if (t.match(/\b(photo|photos|pic|pictures|images)\b/)) return 'PHOTO_REQUEST';
  if (t.match(/\b(video|videos)\b/)) return 'VIDEO_REQUEST';

  if (t.match(/\b(discount|reduce|final price|last price|kam karo|negotiate)\b/)) return 'NEGOTIATION';
  if (t.match(/\b(loan|emi|finance|bank)\b/)) return 'LOAN_QUERY';

  if (t.match(/\b(price|cost|budget|kitna|kitne|rupees|lakh|cr|crore)\b/)) return 'PRICE_INQUIRY';
  if (t.match(/\b(location|where|kaha|kuthe)\b/)) return 'LOCATION_INQUIRY';

  if (t.match(/\b(search|looking for|want|chahiye|pahije|bhk|villa|plot|apartment)\b/)) return 'PROPERTY_SEARCH';
  if (t.match(/\b(amenities|pool|gym|parking)\b/)) return 'AMENITIES_INQUIRY';
  if (t.match(/\b(available|availability|is it empty)\b/)) return 'AVAILABILITY_INQUIRY';

  return 'UNKNOWN';
};
