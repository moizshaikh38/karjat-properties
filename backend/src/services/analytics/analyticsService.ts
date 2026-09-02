import { db } from '../../database/client';

export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
}

// 1. Lead Analytics
export const getLeadAnalytics = async (range: AnalyticsDateRange, agentId?: string) => {
  const client = db.getClient();
  
  let query = client.from('leads').select('status, source, created_at, lead_score');
  
  if (agentId) {
    query = query.eq('assigned_agent_id', agentId);
  }
  
  if (range.startDate) {
    query = query.gte('created_at', range.startDate);
  }
  if (range.endDate) {
    query = query.lte('created_at', range.endDate);
  }

  const { data: leads, error } = await query;
  if (error) throw error;

  const total = leads.length;
  const newLeads = leads.filter(l => l.status === 'NEW' || l.status === 'CONTACTED').length;
  const qualifiedLeads = leads.filter(l => l.status === 'QUALIFIED' || l.status === 'PROPERTY_INTEREST' || l.status === 'SHORTLISTED').length;
  const hotLeads = leads.filter(l => l.lead_score && l.lead_score >= 80).length;
  const conversions = leads.filter(l => l.status === 'WON').length;
  const lostLeads = leads.filter(l => l.status === 'LOST').length;

  const sourceCounts = leads.reduce((acc: any, lead) => {
    const s = lead.source || 'UNKNOWN';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const conversionBySource = leads.filter(l => l.status === 'WON').reduce((acc: any, lead) => {
    const s = lead.source || 'UNKNOWN';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const sourceConversionRates = Object.keys(sourceCounts).map(source => ({
    source,
    leads: sourceCounts[source],
    conversions: conversionBySource[source] || 0,
    rate: sourceCounts[source] > 0 ? ((conversionBySource[source] || 0) / sourceCounts[source] * 100).toFixed(2) : 0
  }));

  // Funnel
  const funnel = {
    total,
    qualified: qualifiedLeads,
    visits: leads.filter(l => ['SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'NEGOTIATION', 'WON'].includes(l.status)).length,
    negotiation: leads.filter(l => ['NEGOTIATION', 'WON'].includes(l.status)).length,
    converted: conversions
  };

  return { total, newLeads, qualifiedLeads, hotLeads, conversions, lostLeads, sourceConversionRates, funnel };
};

// 2. WhatsApp / AI Analytics
export const getAIWhatsAppAnalytics = async (range: AnalyticsDateRange, agentId?: string) => {
  const client = db.getClient();
  
  // Messages Volume
  let msgQuery = client.from('whatsapp_messages').select('direction, created_at, status');
  if (range.startDate) msgQuery = msgQuery.gte('created_at', range.startDate);
  if (range.endDate) msgQuery = msgQuery.lte('created_at', range.endDate);

  const { data: messages } = await msgQuery;
  const msgs = messages || [];
  
  const incoming = msgs.filter(m => m.direction === 'incoming').length;
  const outgoing = msgs.filter(m => m.direction === 'outgoing').length;

  // Conversations (AI Resolution Rate)
  let convQuery = client.from('whatsapp_conversations').select('mode, created_at, human_takeover_at');
  if (range.startDate) convQuery = convQuery.gte('created_at', range.startDate);
  if (range.endDate) convQuery = convQuery.lte('created_at', range.endDate);

  const { data: convs } = await convQuery;
  const conversations = convs || [];
  
  const aiHandled = conversations.filter(c => c.mode === 'ai' || c.human_takeover_at !== null); // Started as AI
  const humanHandoffs = conversations.filter(c => c.human_takeover_at !== null).length;
  const resolvedByAI = aiHandled.length - humanHandoffs;
  const aiResolutionRate = aiHandled.length > 0 ? ((resolvedByAI / aiHandled.length) * 100).toFixed(2) : 0;
  const humanHandoffRate = aiHandled.length > 0 ? ((humanHandoffs / aiHandled.length) * 100).toFixed(2) : 0;

  return {
    messages: { incoming, outgoing, total: incoming + outgoing },
    conversations: {
      total: conversations.length,
      aiHandled: aiHandled.length,
      resolvedByAI,
      humanHandoffs,
      aiResolutionRate,
      humanHandoffRate
    }
  };
};

// 3. Properties Analytics
export const getPropertyAnalytics = async (range: AnalyticsDateRange) => {
  const client = db.getClient();
  let query = client.from('property_interactions').select('property_id, interaction_type, properties(name)');
  if (range.startDate) query = query.gte('created_at', range.startDate);
  if (range.endDate) query = query.lte('created_at', range.endDate);

  const { data: interactions } = await query;
  if (!interactions) return { topProperties: [] };

  const propStats: Record<string, any> = {};
  
  for (const interaction of interactions) {
    if (!interaction.properties) continue;
    
    // Check if property is array (sometimes PostgREST returns array for one-to-one if schema is ambiguous, but here it's object)
    const propDetails: any = Array.isArray(interaction.properties) ? interaction.properties[0] : interaction.properties;
    const pId = interaction.property_id;
    
    if (!propStats[pId]) {
      propStats[pId] = { id: pId, name: propDetails.name, recommended: 0, shortlisted: 0, visits: 0 };
    }
    
    if (interaction.interaction_type === 'recommended' || interaction.interaction_type === 'viewed') propStats[pId].recommended++;
    if (interaction.interaction_type === 'interested' || interaction.interaction_type === 'shortlisted') propStats[pId].shortlisted++;
  }

  const topProperties = Object.values(propStats).sort((a, b) => b.shortlisted - a.shortlisted).slice(0, 5);

  return { topProperties };
};

// 4. Agent Analytics
export const getAgentAnalytics = async (range: AnalyticsDateRange) => {
  const client = db.getClient();
  // Simplified: group leads by assigned_agent_id
  let query = client.from('leads').select('assigned_agent_id, status');
  if (range.startDate) query = query.gte('created_at', range.startDate);
  if (range.endDate) query = query.lte('created_at', range.endDate);

  const { data: leads } = await query;
  if (!leads) return { agents: [] };

  const agentStats: Record<string, any> = {};
  leads.forEach(l => {
    if (!l.assigned_agent_id) return;
    const aId = l.assigned_agent_id;
    if (!agentStats[aId]) agentStats[aId] = { id: aId, assigned: 0, conversions: 0 };
    
    agentStats[aId].assigned++;
    if (l.status === 'WON') agentStats[aId].conversions++;
  });

  const agents = Object.values(agentStats).map(a => ({
    ...a,
    conversionRate: a.assigned > 0 ? ((a.conversions / a.assigned) * 100).toFixed(2) : 0
  }));

  return { agents };
};
