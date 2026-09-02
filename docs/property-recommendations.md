# Property Recommendation Engine

## Overview
The matching engine uses a deterministic algorithm to evaluate the active `properties` table against a specific lead's `lead_requirements`. The output is purely factual and never relies on LLM hallucination for core property data.

## Features
### 1. Status Guard
Only properties with `status = 'available'` are ever evaluated. Sold, inactive, or pending properties are strictly removed at the DB query layer.

### 2. Hard Filters
- **Negative Preferences**: If a user explicitly states they do NOT want an amenity (e.g. `negative_preferences = ['pool']`), any property containing that amenity is instantly excluded from recommendations.
- **Strict Budget Ceiling**: Properties priced >5% over the customer's maximum budget are excluded.

### 3. Match Scoring (0-100)
- **Budget Fit (35 points)**: Exact match or under-budget earns 35 points. Properties utilizing the 5% buffer earn 20 points and are explicitly flagged.
- **BHK Match (25 points)**: Exact matches earn 25 points. Over-delivering (e.g., offering a 4BHK when 3BHK was requested) earns partial points (15) as a fallback.
- **Location (20 points)**: Match against `preferred_locations`.
- **Property Type (10 points)**: Exact type matching.
- **Amenities (10 points)**: Fractional scoring based on the percentage of requested amenities available in the property.

### 4. Ranking
Properties scoring 90+ are returned as `exactMatches`. Properties scoring 60-89 are returned as `alternatives`. The system caps the total return limit to 3-5 to prevent overwhelming the user interface and AI context window.
