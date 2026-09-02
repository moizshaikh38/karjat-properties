import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateTemplateBody } from '../src/services/campaigns/templateService';
import { isMarketingEligible } from '../src/services/campaigns/audienceBuilderService';
import { processCampaignQueue } from '../src/services/campaigns/campaignWorker';
import { AppError } from '../src/utils/errors';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockGte = vi.fn().mockReturnThis();
const mockLte = vi.fn().mockReturnThis();
const mockIn = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockSingle = vi.fn().mockReturnThis();

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  gte: mockGte,
  lte: mockLte,
  in: mockIn,
  limit: mockLimit,
  single: mockSingle,
  then: (resolve: any) => resolve({ data: null, error: null })
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockGte.mockReturnValue(mockQueryBuilder);
mockLte.mockReturnValue(mockQueryBuilder);
mockIn.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);
mockSingle.mockReturnValue(mockQueryBuilder);

vi.mock('../src/database/client', () => ({
  db: {
    getClient: vi.fn(() => ({
      from: vi.fn().mockReturnValue(mockQueryBuilder),
      rpc: vi.fn().mockResolvedValue({})
    }))
  }
}));

describe('Campaign Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Template Validation', () => {
    it('allows valid template variables', () => {
      expect(() => validateTemplateBody('Hello {{customer_name}}, check out {{property_name}}.')).not.toThrow();
    });

    it('rejects unknown template variables', () => {
      expect(() => validateTemplateBody('Hello {{hacker_param}}.')).toThrow(AppError);
    });
  });

  describe('Audience Suppression & Opt-outs', () => {
    it('suppresses marketing for LOST leads', async () => {
      mockQueryBuilder.then = (resolve: any) => resolve({ data: { status: 'LOST' }, error: null });
      const eligible = await isMarketingEligible('lead-1');
      expect(eligible).toBe(false);
    });

    it('suppresses marketing if recently contacted', async () => {
      // Mock lead is NEW
      let callCount = 0;
      mockQueryBuilder.then = (resolve: any) => {
        callCount++;
        if (callCount === 1) return resolve({ data: { status: 'NEW' }, error: null });
        if (callCount === 2) return resolve({ data: [{ id: 'msg-1' }], error: null });
        return resolve({ data: null, error: null });
      };

      const eligible = await isMarketingEligible('lead-1');
      expect(eligible).toBe(false); // recentMsgs array length > 0 means recently contacted
    });
  });
});
