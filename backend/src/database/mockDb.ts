import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

interface TableData {
  [tableName: string]: any[];
}

const INITIAL_DATA: TableData = {
  properties: [
    {
      id: '11111111-1111-1111-a111-111111111111',
      property_code: 'KP-VIL-001',
      name: 'Luxury Riverfront Villa',
      title: 'Luxury Riverfront Villa in Karjat',
      description: 'A stunning 3 BHK villa with private pool, landscaped garden and scenic river views in Bhilavle.',
      property_type: 'villa',
      listing_type: 'sale',
      status: 'available',
      location: 'Bhilavle',
      location_city: 'Karjat',
      city: 'Karjat',
      location_neighborhood: 'Riverfront Estate',
      address: 'Plot 12, Riverfront Estate, Bhilavle, Karjat 410201',
      price: 12500000,
      price_min: 12000000,
      price_max: 13000000,
      bhk: 3,
      bathrooms: 3,
      size_sqft: 2400,
      carpet_area_sqft: 1900,
      builtup_area_sqft: 2400,
      amenities: ['Private Pool', 'Landscaped Garden', '24x7 Security', 'Power Backup', 'River View', 'Clubhouse'],
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
      brochure_url: 'https://karjatproperties.com/brochures/KP-VIL-001.pdf',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '22222222-2222-2222-a222-222222222222',
      property_code: 'KP-APT-002',
      name: 'Scenic Mountain View Apartment',
      title: 'Scenic Mountain View 2BHK Apartment',
      description: 'Modern 2 BHK gated community apartment near Karjat Station with excellent connectivity and mountain vistas.',
      property_type: 'apartment',
      listing_type: 'sale',
      status: 'available',
      location: 'Dahivali',
      location_city: 'Karjat',
      city: 'Karjat',
      location_neighborhood: 'Mountain Heights',
      address: 'Tower A-402, Mountain Heights, Dahivali, Karjat',
      price: 4500000,
      price_min: 4200000,
      price_max: 4800000,
      bhk: 2,
      bathrooms: 2,
      size_sqft: 950,
      carpet_area_sqft: 750,
      builtup_area_sqft: 950,
      amenities: ['Gymnasium', 'Children Play Area', 'High Speed Elevators', 'CCTV Surveillance', 'Covered Parking'],
      images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
      brochure_url: 'https://karjatproperties.com/brochures/KP-APT-002.pdf',
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '33333333-3333-3333-a333-333333333333',
      property_code: 'KP-FRM-003',
      name: 'Green Acres Farmhouse',
      title: 'Spacious 4 BHK Farmhouse with Private Pool',
      description: 'Expansive 4 BHK countryside estate on 1 acre of lush land in Khandpe, ideal for weekend retreat or agro-tourism.',
      property_type: 'farmhouse',
      listing_type: 'sale',
      status: 'available',
      location: 'Khandpe',
      location_city: 'Karjat',
      city: 'Karjat',
      location_neighborhood: 'Green Acres',
      address: 'Estate 7, Green Acres, Khandpe, Karjat',
      price: 25000000,
      price_min: 24000000,
      price_max: 26000000,
      bhk: 4,
      bathrooms: 5,
      size_sqft: 4200,
      carpet_area_sqft: 3500,
      builtup_area_sqft: 4200,
      amenities: ['Private Pool', 'Organic Orchard', 'Gazebo', 'Servant Quarters', 'Solar Power', 'Mountain View'],
      images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
      brochure_url: 'https://karjatproperties.com/brochures/KP-FRM-003.pdf',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '44444444-4444-4444-a444-444444444444',
      property_code: 'KP-PLT-004',
      name: 'Hilltop NA Sanctioned Plot',
      title: 'Ready Possession NA Plot with Clear Title',
      description: 'Collector NA sanctioned 3,000 sq.ft residential plot with water connection, electricity and boundary fencing in Kashele.',
      property_type: 'plot',
      listing_type: 'sale',
      status: 'available',
      location: 'Kashele',
      location_city: 'Karjat',
      city: 'Karjat',
      location_neighborhood: 'Hillside Enclave',
      address: 'Plot 45, Hillside Enclave, Kashele, Karjat',
      price: 3600000,
      price_min: 3500000,
      price_max: 3800000,
      bhk: 0,
      bathrooms: 0,
      size_sqft: 3000,
      carpet_area_sqft: 3000,
      builtup_area_sqft: 3000,
      amenities: ['Tar Road Access', 'Water Connection', 'Electricity Grid', 'Clear Title 7/12', 'Gated Community'],
      images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
      brochure_url: 'https://karjatproperties.com/brochures/KP-PLT-004.pdf',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  leads: [
    {
      id: 'l1111111-1111-1111-a111-111111111111',
      name: 'Rajesh Sharma',
      phone: '919876543210',
      email: 'rajesh.sharma@example.com',
      source: 'WHATSAPP',
      status: 'QUALIFIED',
      classification: 'HOT',
      temperature: 'VERY_HOT',
      priority: 'URGENT',
      lead_score: 92,
      assigned_agent_id: '11111111-1111-1111-a111-111111111111',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'l2222222-2222-2222-a222-222222222222',
      name: 'Pooja Mehta',
      phone: '919812345678',
      email: 'pooja.mehta@example.com',
      source: 'WEBSITE',
      status: 'SITE_VISIT_SCHEDULED',
      classification: 'HOT',
      temperature: 'HOT',
      priority: 'HIGH',
      lead_score: 85,
      assigned_agent_id: '11111111-1111-1111-a111-111111111111',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'l3333333-3333-3333-a333-333333333333',
      name: 'Vikram Deshmukh',
      phone: '919765432100',
      email: 'vikram.d@example.com',
      source: 'CAMPAIGN',
      status: 'PROPERTY_INTEREST',
      classification: 'WARM',
      temperature: 'WARM',
      priority: 'MEDIUM',
      lead_score: 68,
      assigned_agent_id: '22222222-2222-2222-a222-222222222222',
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'l4444444-4444-4444-a444-444444444444',
      name: 'Ananya Patel',
      phone: '919898989898',
      email: 'ananya.p@example.com',
      source: 'WHATSAPP',
      status: 'NEW',
      classification: 'COLD',
      temperature: 'COLD',
      priority: 'LOW',
      lead_score: 45,
      assigned_agent_id: '33333333-3333-3333-a333-333333333333',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  lead_requirements: [
    {
      id: 'lr-1',
      lead_id: 'l1111111-1111-1111-a111-111111111111',
      min_budget: 8000000,
      max_budget: 15000000,
      property_type: 'villa',
      min_bhk: 3,
      preferred_bhk: 3,
      preferred_locations: ['Bhilavle', 'Kashele'],
      purchase_timeline: 'Immediate (within 1 month)',
      purpose: 'Weekend Holiday Home',
      updated_at: new Date().toISOString(),
    },
    {
      id: 'lr-2',
      lead_id: 'l2222222-2222-2222-a222-222222222222',
      min_budget: 3500000,
      max_budget: 5000000,
      property_type: 'apartment',
      min_bhk: 2,
      preferred_bhk: 2,
      preferred_locations: ['Dahivali', 'Station Road'],
      purchase_timeline: '3 months',
      purpose: 'Investment',
      updated_at: new Date().toISOString(),
    }
  ],
  whatsapp_conversations: [
    {
      id: 'c1111111-1111-1111-a111-111111111111',
      lead_id: 'l1111111-1111-1111-a111-111111111111',
      whatsapp_phone: '919876543210',
      mode: 'ai',
      status: 'active',
      last_message_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      human_takeover_at: null,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'c2222222-2222-2222-a222-222222222222',
      lead_id: 'l2222222-2222-2222-a222-222222222222',
      whatsapp_phone: '919812345678',
      mode: 'human',
      status: 'active',
      last_message_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      human_takeover_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'c3333333-3333-3333-a333-333333333333',
      lead_id: 'l3333333-3333-3333-a333-333333333333',
      whatsapp_phone: '919765432100',
      mode: 'paused',
      status: 'active',
      last_message_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      human_takeover_at: null,
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  whatsapp_messages: [
    {
      id: 'm1',
      conversation_id: 'c1111111-1111-1111-a111-111111111111',
      whatsapp_message_id: 'wamid.101',
      direction: 'incoming',
      message_type: 'text',
      text_content: 'Hi, I am looking for a 3 BHK villa in Karjat with a private pool.',
      status: 'read',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'm2',
      conversation_id: 'c1111111-1111-1111-a111-111111111111',
      whatsapp_message_id: 'wamid.102',
      direction: 'outgoing',
      message_type: 'text',
      text_content: 'Hello Rajesh ji! Welcome to Karjat Properties. 🏡 We have verified 3 BHK villas in Bhilavle with private swimming pools around ₹1.25 Cr. May I know your preferred budget range?',
      status: 'read',
      created_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    },
    {
      id: 'm3',
      conversation_id: 'c1111111-1111-1111-a111-111111111111',
      whatsapp_message_id: 'wamid.103',
      direction: 'incoming',
      message_type: 'text',
      text_content: 'Around 1 to 1.3 Cr is comfortable. Can we do a site visit this Saturday?',
      status: 'read',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'm4',
      conversation_id: 'c1111111-1111-1111-a111-111111111111',
      whatsapp_message_id: 'wamid.104',
      direction: 'outgoing',
      message_type: 'text',
      text_content: 'Perfect! 👍 We have scheduled visits available on Saturday at 10:00 AM and 01:00 PM with complimentary pickup from Karjat Railway Station. Which time works best for you?',
      status: 'delivered',
      created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    }
  ],
  site_visits: [
    {
      id: 'sv-1',
      lead_id: 'l1111111-1111-1111-a111-111111111111',
      property_id: '11111111-1111-1111-a111-111111111111',
      conversation_id: 'c1111111-1111-1111-a111-111111111111',
      scheduled_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'scheduled',
      agent_notes: 'Client requested Karjat Station pickup at 10:00 AM.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sv-2',
      lead_id: 'l2222222-2222-2222-a222-222222222222',
      property_id: '22222222-2222-2222-a222-222222222222',
      conversation_id: 'c2222222-2222-2222-a222-222222222222',
      scheduled_date: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: 'completed',
      agent_notes: 'Completed successfully. Client liked 2 BHK layout.',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  followups: [
    {
      id: 'fu-1',
      lead_id: 'l1111111-1111-1111-a111-111111111111',
      conversation_id: 'c1111111-1111-1111-a111-111111111111',
      followup_type: 'site_visit_followup',
      scheduled_at: new Date(Date.now() + 86400000 * 1).toISOString(),
      status: 'pending',
      reason: 'Confirm Saturday 10 AM site visit details',
      step_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'fu-2',
      lead_id: 'l3333333-3333-3333-a333-333333333333',
      conversation_id: 'c3333333-3333-3333-a333-333333333333',
      followup_type: 'property_followup',
      scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
      status: 'pending',
      reason: 'Check interest in Green Acres Farmhouse brochure',
      step_number: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  campaigns: [
    {
      id: 'cmp-1',
      name: 'Monsoon Villa Showcase 2026',
      template_name: 'monsoon_villa_launch',
      status: 'sent',
      audience_filter: { status: 'QUALIFIED', budget_min: 8000000 },
      total_recipients: 150,
      sent_count: 150,
      delivered_count: 146,
      read_count: 118,
      replied_count: 34,
      scheduled_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'cmp-2',
      name: 'Weekend NA Plot Investment Drive',
      template_name: 'na_plot_offer',
      status: 'scheduled',
      audience_filter: { property_type: 'plot' },
      total_recipients: 80,
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      replied_count: 0,
      scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(),
      created_at: new Date().toISOString(),
    }
  ],
  whatsapp_templates: [
    {
      id: 'tpl-1',
      name: 'monsoon_villa_launch',
      category: 'MARKETING',
      language: 'en',
      status: 'APPROVED',
      body_text: 'Hello {{1}}, explore luxury riverfront villas in Karjat starting ₹1.25 Cr with private pool.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tpl-2',
      name: 'site_visit_confirmation',
      category: 'UTILITY',
      language: 'en',
      status: 'APPROVED',
      body_text: 'Dear {{1}}, your site visit for {{2}} is confirmed for {{3}} with Karjat Station pickup.',
      created_at: new Date().toISOString(),
    }
  ],
  property_interactions: [
    {
      id: 'pi-1',
      lead_id: 'l1111111-1111-1111-a111-111111111111',
      property_id: '11111111-1111-1111-a111-111111111111',
      interaction_type: 'shortlisted',
      notes: 'Customer shortlisted Riverfront Villa for Saturday visit.',
      created_at: new Date().toISOString(),
    }
  ],
  property_recommendations: [
    {
      id: 'pr-1',
      lead_id: 'l1111111-1111-1111-a111-111111111111',
      property_id: '11111111-1111-1111-a111-111111111111',
      match_score: 95,
      is_shortlisted: true,
      created_at: new Date().toISOString(),
    }
  ],
  ai_conversation_state: [
    {
      id: 'st-1',
      conversation_id: 'c1111111-1111-1111-a111-111111111111',
      state: 'SITE_VISIT_SCHEDULING',
      current_stage: 'site_visit',
      language: 'en',
      last_intent: 'SITE_VISIT_REQUEST',
      summary: { budget: '1.25 Cr', bhk: 3, type: 'villa' },
      updated_at: new Date().toISOString(),
    }
  ],
  audit_logs: []
};

// Deep copy store for runtime in-memory CRUD operations
class MockDatabase {
  private store: TableData;

  constructor() {
    this.store = JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  public getTable(tableName: string): any[] {
    const tableKey = tableName.toLowerCase();
    // Support aliases e.g. followup_tasks -> followups
    if (!this.store[tableKey]) {
      if (tableKey === 'followup_tasks') return this.getTable('followups');
      this.store[tableKey] = [];
    }
    return this.store[tableKey];
  }

  public from(tableName: string) {
    return new MockQueryBuilder(this, tableName);
  }
}

class MockQueryBuilder {
  private db: MockDatabase;
  private tableName: string;
  private filters: Array<(row: any) => boolean> = [];
  private orderConfig?: { column: string; ascending: boolean };
  private limitCount?: number;
  private offsetCount?: number;
  private isSingle = false;
  private pendingInsert?: any | any[];
  private pendingUpdate?: any;
  private pendingDelete = false;
  private pendingUpsert?: any | any[];

  constructor(db: MockDatabase, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  public select(columns?: string) {
    // Columns parsing could be done if needed, returning all fields for in-memory
    return this;
  }

  public insert(data: any) {
    this.pendingInsert = data;
    return this;
  }

  public update(data: any) {
    this.pendingUpdate = data;
    return this;
  }

  public upsert(data: any, options?: any) {
    this.pendingUpsert = data;
    return this;
  }

  public delete() {
    this.pendingDelete = true;
    return this;
  }

  public eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  public neq(column: string, value: any) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  public in(column: string, values: any[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  public gte(column: string, value: any) {
    this.filters.push((row) => {
      const val = row[column];
      if (val === undefined || val === null) return false;
      return val >= value;
    });
    return this;
  }

  public lte(column: string, value: any) {
    this.filters.push((row) => {
      const val = row[column];
      if (val === undefined || val === null) return false;
      return val <= value;
    });
    return this;
  }

  public ilike(column: string, pattern: string) {
    const cleanPattern = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push((row) => {
      const val = String(row[column] || '').toLowerCase();
      return val.includes(cleanPattern);
    });
    return this;
  }

  public or(conditionString: string) {
    // simple OR matching for text search
    return this;
  }

  public order(column: string, options?: { ascending?: boolean }) {
    this.orderConfig = {
      column,
      ascending: options?.ascending ?? true,
    };
    return this;
  }

  public range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  public limit(count: number) {
    this.limitCount = count;
    return this;
  }

  public single() {
    this.isSingle = true;
    return this;
  }

  // Promise-like resolution when awaited
  public then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const result = this.execute();
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }

  private execute(): { data: any; error: any; count?: number } {
    const table = this.db.getTable(this.tableName);

    // 1. Handle Insert
    if (this.pendingInsert !== undefined) {
      const items = Array.isArray(this.pendingInsert) ? this.pendingInsert : [this.pendingInsert];
      const inserted = items.map((item) => {
        const record = {
          id: item.id || randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item,
        };
        table.unshift(record);
        return record;
      });

      return {
        data: this.isSingle ? inserted[0] : inserted,
        error: null,
      };
    }

    // 2. Handle Upsert
    if (this.pendingUpsert !== undefined) {
      const items = Array.isArray(this.pendingUpsert) ? this.pendingUpsert : [this.pendingUpsert];
      const upserted = items.map((item) => {
        let existingIndex = -1;
        if (item.conversation_id) {
          existingIndex = table.findIndex((r) => r.conversation_id === item.conversation_id);
        } else if (item.id) {
          existingIndex = table.findIndex((r) => r.id === item.id);
        }

        if (existingIndex >= 0) {
          table[existingIndex] = { ...table[existingIndex], ...item, updated_at: new Date().toISOString() };
          return table[existingIndex];
        } else {
          const record = {
            id: item.id || randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...item,
          };
          table.unshift(record);
          return record;
        }
      });

      return {
        data: this.isSingle ? upserted[0] : upserted,
        error: null,
      };
    }

    // 3. Handle Update
    if (this.pendingUpdate !== undefined) {
      const matched = table.filter((row) => this.filters.every((f) => f(row)));
      matched.forEach((row) => {
        Object.assign(row, this.pendingUpdate, { updated_at: new Date().toISOString() });
      });

      return {
        data: this.isSingle ? matched[0] || null : matched,
        error: null,
      };
    }

    // 4. Handle Delete
    if (this.pendingDelete) {
      const originalLength = table.length;
      for (let i = table.length - 1; i >= 0; i--) {
        if (this.filters.every((f) => f(table[i]))) {
          table.splice(i, 1);
        }
      }

      return {
        data: null,
        error: null,
      };
    }

    // 5. Query / Select
    let results = table.filter((row) => this.filters.every((f) => f(row)));

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      results.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    const totalCount = results.length;

    if (this.offsetCount !== undefined || this.limitCount !== undefined) {
      const start = this.offsetCount || 0;
      const end = this.limitCount !== undefined ? start + this.limitCount : undefined;
      results = results.slice(start, end);
    }

    // Enrich joined relations for mock display
    results = results.map((row) => {
      const cloned = { ...row };
      if (this.tableName === 'whatsapp_conversations' && cloned.lead_id && !cloned.lead) {
        const lead = this.db.getTable('leads').find((l) => l.id === cloned.lead_id);
        if (lead) cloned.lead = lead;
      }
      if (this.tableName === 'site_visits') {
        if (cloned.lead_id && !cloned.lead) {
          const lead = this.db.getTable('leads').find((l) => l.id === cloned.lead_id);
          if (lead) cloned.lead = lead;
        }
        if (cloned.property_id && !cloned.property) {
          const prop = this.db.getTable('properties').find((p) => p.id === cloned.property_id);
          if (prop) cloned.property = prop;
        }
      }
      if (this.tableName === 'followups' && cloned.lead_id && !cloned.lead) {
        const lead = this.db.getTable('leads').find((l) => l.id === cloned.lead_id);
        if (lead) cloned.lead = lead;
      }
      return cloned;
    });

    if (this.isSingle) {
      if (results.length === 0) {
        return { data: null, error: { code: 'PGRST116', message: 'The result contains 0 rows' } };
      }
      return { data: results[0], error: null };
    }

    return { data: results, error: null, count: totalCount };
  }
}

export const mockDb = new MockDatabase();
