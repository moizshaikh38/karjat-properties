import { describe, it, expect, vi, beforeEach } from 'vitest';
import { conversationStateMachine } from '../src/services/ai/conversationStateMachine';
import { detectIntents } from '../src/services/ai/intentDetectionService';
import { buildSalesAgentSystemPrompt } from '../src/services/ai/salesAgentPrompt';
import { executeGetPropertyDetails } from '../src/services/ai/tools/getPropertyDetailsTool';
import { executeCheckPropertyAvailability } from '../src/services/ai/tools/checkPropertyAvailabilityTool';
import { executeGetCurrentPropertyPrice } from '../src/services/ai/tools/getCurrentPropertyPriceTool';
import { executeCompareProperties } from '../src/services/ai/tools/comparePropertiesTool';
import { executeGetSiteVisitSlots } from '../src/services/ai/tools/getSiteVisitSlotsTool';
import { validateAIResponse } from '../src/services/ai/aiResponseValidator';
import { db } from '../src/database/client';

const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockIn = vi.fn().mockReturnThis();

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  single: mockSingle,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockIn.mockReturnValue(mockQueryBuilder);

vi.mock('../src/database/client', () => ({
  db: {
    getClient: vi.fn(() => ({
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    })),
  },
}));

vi.mock('../src/services/ai/aiService', () => ({
  getAIProvider: vi.fn(() => ({
    generateResponse: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        intents: ['PROPERTY_SEARCH', 'SITE_VISIT_REQUEST'],
        confidence: 0.95,
      }),
    }),
  })),
}));

describe('AI Sales Agent Engine (Step 18)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Multi-Intent Classification', () => {
    it('should extract multiple intents with confidence scores', async () => {
      const result = await detectIntents('3 BHK villa chahiye 80 lakh ke andar aur Sunday ko visit karna hai');
      expect(result.intents).toContain('PROPERTY_SEARCH');
      expect(result.intents).toContain('SITE_VISIT_REQUEST');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should default to GREETING for empty messages', async () => {
      const result = await detectIntents('');
      expect(result.intents).toEqual(['GREETING']);
    });
  });

  describe('Conversation State Machine', () => {
    it('should transition from NEW to DISCOVERY when requirements are incomplete', () => {
      const nextState = conversationStateMachine.determineNextState({
        currentState: 'NEW',
        intents: ['GREETING'],
        requirements: {},
      });
      expect(nextState).toBe('DISCOVERY');
    });

    it('should transition from DISCOVERY to QUALIFICATION when budget and BHK are known', () => {
      const nextState = conversationStateMachine.determineNextState({
        currentState: 'DISCOVERY',
        intents: ['BUDGET_DISCUSSION'],
        requirements: { max_budget: 8000000, min_bhk: 3 },
      });
      expect(nextState).toBe('QUALIFICATION');
    });

    it('should transition to PROPERTY_PRESENTATION when properties are found', () => {
      const nextState = conversationStateMachine.determineNextState({
        currentState: 'QUALIFICATION',
        intents: ['PROPERTY_SEARCH'],
        requirements: { max_budget: 8000000, min_bhk: 3 },
        hasFoundProperties: true,
      });
      expect(nextState).toBe('PROPERTY_PRESENTATION');
    });

    it('should transition to SITE_VISIT_SCHEDULING when customer requests visit', () => {
      const nextState = conversationStateMachine.determineNextState({
        currentState: 'PROPERTY_DISCUSSION',
        intents: ['SITE_VISIT_REQUEST'],
      });
      expect(nextState).toBe('SITE_VISIT_SCHEDULING');
    });

    it('should immediately transition to HUMAN_HANDOFF on negotiation or complaint', () => {
      const nextState = conversationStateMachine.determineNextState({
        currentState: 'PROPERTY_DISCUSSION',
        intents: ['NEGOTIATION'],
      });
      expect(nextState).toBe('HUMAN_HANDOFF');
    });
  });

  describe('Controlled Backend Tools', () => {
    it('getPropertyDetails should return verified property data', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'prop-123',
          name: 'Green Valley Villa',
          property_type: 'villa',
          bhk: 3,
          bathrooms: 3,
          price: 7800000,
          size_sqft: 2200,
          location_city: 'Karjat',
          amenities: ['Private Pool', 'Garden'],
          status: 'available',
        },
      });

      const res = await executeGetPropertyDetails(JSON.stringify({ propertyId: 'prop-123' }));
      expect(res.success).toBe(true);
      expect(res.property!.name).toBe('Green Valley Villa');
      expect(res.property!.formattedPrice).toBe('₹78,00,000');
      expect(res.property!.amenities).toContain('Private Pool');
    });

    it('checkPropertyAvailability should verify live status', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'prop-123', name: 'Hilltop Villa', status: 'available' },
      });

      const res = await executeCheckPropertyAvailability(JSON.stringify({ propertyId: 'prop-123' }));
      expect(res.success).toBe(true);
      expect(res.isAvailable).toBe(true);
    });

    it('getCurrentPropertyPrice should return authoritative live pricing', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'prop-123', name: 'Riverside Plot', price: 4500000, size_sqft: 3000 },
      });

      const res = await executeGetCurrentPropertyPrice(JSON.stringify({ propertyId: 'prop-123' }));
      expect(res.success).toBe(true);
      expect(res.price).toBe(4500000);
      expect(res.formattedPrice).toBe('₹45,00,000');
      expect(res.ratePerSqFt).toBe('₹1,500/sq.ft');
    });

    it('compareProperties should format structured comparison matrix', async () => {
      mockIn.mockResolvedValue({
        data: [
          { id: 'prop-1', name: 'Villa A', property_type: 'villa', bhk: 3, price: 7500000, location_city: 'Karjat' },
          { id: 'prop-2', name: 'Villa B', property_type: 'villa', bhk: 4, price: 9000000, location_city: 'Karjat' },
        ],
      });

      const res = await executeCompareProperties(JSON.stringify({ propertyIds: ['prop-1', 'prop-2'] }));
      expect(res.success).toBe(true);
      expect(res.comparison!.length).toBe(2);
      expect(res.comparison![0].formattedPrice).toBe('₹75,00,000');
      expect(res.comparison![1].formattedPrice).toBe('₹90,00,000');
    });

    it('getSiteVisitSlots should return verified standard slots', async () => {
      const res = await executeGetSiteVisitSlots();
      expect(res.success).toBe(true);
      expect(res.availableSlots).toContain('10:00 AM');
      expect(res.availableSlots).toContain('01:00 PM');
      expect(res.availableSlots).toContain('04:00 PM');
    });
  });

  describe('Prompt Injection & System Prompt Builder', () => {
    it('should generate structured system prompt with versioning and business facts', () => {
      const prompt = buildSalesAgentSystemPrompt({
        leadName: 'Amit Sharma',
        leadStage: 'QUALIFIED',
        conversationState: 'PROPERTY_PRESENTATION',
        intents: ['PROPERTY_SEARCH'],
        requirements: { max_budget: 8000000, min_bhk: 3 },
      });

      expect(prompt).toContain('PROMPT VERSION: v1.0');
      expect(prompt).toContain('Karjat Properties');
      expect(prompt).toContain('Amit Sharma');
      expect(prompt).toContain('DISCOVERY DISCIPLINE');
      expect(prompt).toContain('STRICT ACCURACY & ANTI-HALLUCINATION');
      expect(prompt).toContain('PROMPT INJECTION & SECURITY DEFENSES');
    });
  });

  describe('Anti-Hallucination & Response Validation', () => {
    it('should allow clean, safe response', () => {
      const val = validateAIResponse('Here is the 3 BHK Villa in Karjat with private garden for ₹78 Lakh.');
      expect(val.isValid).toBe(true);
    });

    it('should flag unverified discount commitments', () => {
      const val = validateAIResponse('I can offer you a 15% discount on this property right now.');
      expect(val.isValid).toBe(false);
    });
  });
});
