import { describe, it, expect } from 'vitest';
import { calculateLeadScore, getTemperature } from '../src/services/leadScoringService';

describe('Lead Scoring Engine', () => {
  const baseLead = {} as any;

  it('Example 1: Should score correctly based on new formula', () => {
    const requirements = {
      min_budget: 5000000,
      preferred_locations: ['Karjat'],
      property_types: ['villa'],
      preferred_bhk: 3,
      purchase_timeline: 'within_3_months',
    } as any;
    
    const interactions: any[] = [];
    
    const { score, breakdown, temperature } = calculateLeadScore(baseLead, requirements, interactions);
    // Budget (10) + Loc (5) + Type (5) + BHK (5) + Timeline (5) = 30
    expect(score).toBe(30);
    expect(temperature).toBe('WARM');
  });

  it('Example 2: Should score high with site visit', () => {
    const requirements = {
      min_budget: 5000000,
      preferred_locations: ['Karjat'],
      property_types: ['villa'],
      preferred_bhk: 3,
      purchase_timeline: 'immediate',
    } as any;
    
    const interactions = [
      { interaction_type: 'site_visit_requested' }
    ] as any;

    const { score, temperature } = calculateLeadScore(baseLead, requirements, interactions);
    // Budget(10) + Loc(5) + Type(5) + BHK(5) + Timeline(10) = 35. Interactions: Site Visit (30) = 65
    expect(score).toBe(65);
    expect(temperature).toBe('HOT');
  });

  it('Example 3: Only location should score correctly', () => {
    const requirements = {
      preferred_locations: ['Karjat'],
    } as any;
    
    const { score, temperature } = calculateLeadScore(baseLead, requirements, []);
    
    expect(score).toBe(5);
    expect(temperature).toBe('COLD');
  });

  it('Should handle empty requirements and interactions', () => {
    const { score, temperature } = calculateLeadScore(baseLead, null, []);
    expect(score).toBe(0);
    expect(temperature).toBe('COLD');
  });
});
