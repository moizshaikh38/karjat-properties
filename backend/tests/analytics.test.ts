import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as analyticsService from '../src/services/analytics/analyticsService';

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockGte = vi.fn().mockReturnThis();
const mockLte = vi.fn().mockReturnThis();

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  gte: mockGte,
  lte: mockLte,
  then: (resolve: any) => resolve({ data: [], error: null })
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockGte.mockReturnValue(mockQueryBuilder);
mockLte.mockReturnValue(mockQueryBuilder);

vi.mock('../src/database/client', () => ({
  db: {
    getClient: vi.fn(() => ({
      from: vi.fn().mockReturnValue(mockQueryBuilder)
    }))
  }
}));

describe('Analytics Services', () => {
  const range = { startDate: '2026-01-01', endDate: '2026-01-31' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeadAnalytics', () => {
    it('aggregates leads correctly for an admin', async () => {
      // Mock db response
      mockQueryBuilder.then = (resolve: any) => resolve({
        data: [
          { status: 'NEW', source: 'WHATSAPP' },
          { status: 'WON', source: 'WHATSAPP' },
          { status: 'WON', source: 'WEBSITE' },
          { status: 'LOST', source: 'WHATSAPP' }
        ],
        error: null
      });

      const stats = await analyticsService.getLeadAnalytics(range);
      expect(stats.total).toBe(4);
      expect(stats.newLeads).toBe(1);
      expect(stats.conversions).toBe(2);
      expect(stats.lostLeads).toBe(1);
      
      const whatsappSource = stats.sourceConversionRates.find(s => s.source === 'WHATSAPP');
      expect(whatsappSource?.leads).toBe(3);
      expect(whatsappSource?.conversions).toBe(1);
    });

    it('filters by agent if agentId is provided', async () => {
      mockQueryBuilder.then = (resolve: any) => resolve({ data: [], error: null });
      await analyticsService.getLeadAnalytics(range, 'agent-123');
      expect(mockEq).toHaveBeenCalledWith('assigned_agent_id', 'agent-123');
    });
  });

  describe('getAIWhatsAppAnalytics', () => {
    it('calculates resolution rate correctly', async () => {
      // Mock conversations
      mockQueryBuilder.then = (resolve: any) => {
        // We override just for the conversations call
        return resolve({
          data: [
            { mode: 'ai', human_takeover_at: null }, // Resolved by AI
            { mode: 'ai', human_takeover_at: 'timestamp' }, // Human Handoff
            { mode: 'human', human_takeover_at: null } // Ignored
          ],
          error: null
        });
      };

      const stats = await analyticsService.getAIWhatsAppAnalytics(range);
      
      // 2 AI handled, 1 handoff -> 50%
      expect(stats.conversations.aiHandled).toBe(2);
      expect(stats.conversations.humanHandoffs).toBe(1);
      expect(stats.conversations.aiResolutionRate).toBe('50.00');
    });
  });
});
