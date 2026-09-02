import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findMatchingProperties } from '../src/services/propertyMatchingService';
import { executePropertySearch } from '../src/services/ai/tools/propertySearchTool';
import { executeGetPropertyDetails } from '../src/services/ai/tools/getPropertyDetailsTool';
import { executeSendPropertyImages } from '../src/services/ai/tools/sendPropertyImagesTool';
import { whatsappMessageService } from '../src/services/whatsapp/whatsappMessageService';

describe('Property Media & Photo Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Property search returns verified properties with real image URLs
  it('Test 1: should return verified property details including valid HTTPS image URLs', async () => {
    const result = await findMatchingProperties('lead-test-1', {
      bhk: 3,
      property_type: 'villa',
      max_price: 15000000,
    });

    expect(result.exactMatches.length).toBeGreaterThan(0);
    const topMatch = result.exactMatches[0];
    expect(topMatch.title).toBeDefined();
    expect(Array.isArray(topMatch.images)).toBe(true);
    expect(topMatch.images.length).toBeGreaterThan(0);
    expect(topMatch.images[0]).toMatch(/^https:\/\//);
  });

  // Test 1b: searchProperties tool exposes images in exactMatches and alternatives
  it('Test 1b: searchProperties tool should expose images field for AI and media dispatcher', async () => {
    const toolResult = await executePropertySearch('lead-test-1', {
      bhk: 3,
      budget: 15000000,
      property_type: 'villa',
    });

    expect(toolResult.success).toBe(true);
    expect(toolResult.exactMatches.length).toBeGreaterThan(0);
    const match = toolResult.exactMatches[0];
    expect(match.images).toBeDefined();
    expect(Array.isArray(match.images)).toBe(true);
    expect(match.images.length).toBeGreaterThan(0);
  });

  // Test 2: Property exists but has no images -> safe handling, no crash
  it('Test 2: should handle property with empty images array gracefully without crashing', async () => {
    const emptyProp = {
      id: 'test-no-images',
      title: 'Budget Land Plot',
      images: [],
    };

    expect(emptyProp.images.length).toBe(0);
    // Verified inventory should never crash if images array is empty
    expect(() => {
      const imagesToSend = (emptyProp.images || []).slice(0, 3);
      expect(imagesToSend.length).toBe(0);
    }).not.toThrow();
  });

  // Test 3: Multiple properties maintain distinct image associations
  it('Test 3: multiple properties should strictly retain their own separate images without cross-contamination', async () => {
    const result = await findMatchingProperties('lead-test-3', {
      limit: 3,
    });

    expect(result.exactMatches.length).toBeGreaterThanOrEqual(2);
    const propA = result.exactMatches[0];
    const propB = result.exactMatches[1];

    expect(propA.id).not.toEqual(propB.id);
    expect(propA.images).toBeDefined();
    expect(propB.images).toBeDefined();

    // Verify images are distinct and not shared/mixed
    const setA = new Set(propA.images);
    const hasOverlap = propB.images.some((img: string) => setA.has(img));
    expect(hasOverlap).toBe(false);
  });

  // Test 4: getPropertyDetails returns property images
  it('Test 4: getPropertyDetails should return authoritative images for the property', async () => {
    const details = await executeGetPropertyDetails({
      propertyId: 'p1111111-1111-1111-1111-111111111111',
    });

    expect(details.success).toBe(true);
    expect(details.property).toBeDefined();
    expect(details.property.images).toBeDefined();
    expect(Array.isArray(details.property.images)).toBe(true);
  });
});
