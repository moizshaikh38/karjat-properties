# Lead Scoring System

## Overview
Karjat Properties uses a deterministic 100-point scoring algorithm combined with a tiered temperature mapping to provide agents with a reliable gauge of lead engagement and intent.

## Lead Score Pipeline
```mermaid
flowchart TD
    A[Customer Message / Event] --> B[updateLeadScore()]
    B --> C[Calculate Requirements 0-35]
    B --> D[Calculate Interactions 0-65]
    B --> E[Apply Time Decay Penalty]
    E --> F[Sum & Cap 0-100]
    F --> G[Determine Temperature]
    G --> H[Determine Priority]
    H --> I[Update leads table]
    I --> J[Append lead_score_history]
```

## Score Weighting
The system enforces a max of 100 points:
1. **Requirements Completeness (Max 35)**: Points for defining Budget (10), Location (5), Type (5), BHK (5), and Purchase Timeline (10).
2. **Behavioral Intent (Max 65)**: Site Visits (30), Shortlists (20), Property Queries (10), General Engagement (5).
3. **Decay Engine**: Customers inactive for >14 days lose 10 points. >30 days lose 20 points. Decay is automatically appended as a negative breakdown reason.

## Temperature Thresholds
- **VERY_HOT (80-100)**: Immediate sales focus.
- **HOT (60-79)**: Active engagement.
- **WARM (30-59)**: Qualified but early stage.
- **COLD (0-29)**: New or unengaged.

## Priority Engine
Priority is derived by combining the Temperature with real-time `site_visit_requested` events:
- **URGENT**: Lead is HOT/VERY_HOT *and* requested a site visit in the last 48 hours.
- **HIGH**: VERY_HOT.
- **MEDIUM**: HOT.
- **LOW**: WARM/COLD.
