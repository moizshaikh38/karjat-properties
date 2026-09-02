import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canSendFollowup } from '../src/services/followups/followupEligibilityService';
import { db } from '../src/database/client';

vi.mock('../src/database/client', () => {
  return {
    db: {
      getClient: vi.fn(),
    },
  };
});

describe('Followup Eligibility Service', () => {
  const mockFrom = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (db.getClient as any).mockReturnValue({ from: mockFrom });
  });

  const setupMocks = (leadOptions: any, convOptions: any, messagesOptions: any, countOptions: any) => {
    mockFrom.mockImplementation((table) => {
      if (table === 'leads') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: leadOptions }) }) }) };
      }
      if (table === 'whatsapp_conversations') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: convOptions }) }) }) };
      }
      if (table === 'whatsapp_messages') {
        return { select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ single: () => Promise.resolve({ data: messagesOptions }) }) }) }) }) };
      }
      if (table === 'follow_up_tasks') {
        return { select: () => ({ eq: () => ({ eq: () => Promise.resolve({ count: countOptions }) }) }) };
      }
    });
  };

  it('blocks follow-up if lead is opted out', async () => {
    setupMocks({ status: 'new', marketing_opt_out: true }, {}, {}, 0);
    const result = await canSendFollowup('lead1', 'conv1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('opted_out');
  });

  it('blocks follow-up if conversation is in human mode', async () => {
    setupMocks({ status: 'new', marketing_opt_out: false }, { mode: 'human', status: 'active' }, {}, 0);
    const result = await canSendFollowup('lead1', 'conv1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('human_mode');
  });

  it('blocks follow-up if conversation is paused', async () => {
    setupMocks({ status: 'new', marketing_opt_out: false }, { mode: 'paused', status: 'active' }, {}, 0);
    const result = await canSendFollowup('lead1', 'conv1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('paused_mode');
  });

  it('blocks follow-up if lead is converted', async () => {
    setupMocks({ status: 'converted', marketing_opt_out: false }, { mode: 'ai', status: 'active' }, {}, 0);
    const result = await canSendFollowup('lead1', 'conv1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('lead_status_ineligible');
  });

  it('blocks follow-up if minimum gap is not met (recent message)', async () => {
    // Message sent 1 hour ago (less than 12h gap)
    const recentDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    setupMocks(
      { status: 'new', marketing_opt_out: false },
      { mode: 'ai', status: 'active' },
      { direction: 'incoming', created_at: recentDate },
      0
    );
    const result = await canSendFollowup('lead1', 'conv1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('minimum_gap_not_met');
  });

});
