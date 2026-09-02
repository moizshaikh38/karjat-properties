import { db } from '../../database/client';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const ALLOWED_TEMPLATE_VARIABLES = [
  'customer_name',
  'property_name',
  'property_price',
  'property_location',
  'agent_name',
  'visit_date'
];

export const validateTemplateBody = (body: string) => {
  const variableRegex = /{{(.*?)}}/g;
  let match;
  while ((match = variableRegex.exec(body)) !== null) {
    const variable = match[1].trim();
    if (!ALLOWED_TEMPLATE_VARIABLES.includes(variable)) {
      throw new AppError(`Invalid variable: ${variable}. Allowed: ${ALLOWED_TEMPLATE_VARIABLES.join(', ')}`, 400, 'VALIDATION_ERROR');
    }
  }
};

export const syncTemplatesFromProvider = async () => {
  const client = db.getClient();
  // Mock Provider Fetch
  const providerTemplates = [
    {
      provider_template_id: 'temp_123',
      name: 'new_villa_launch',
      language: 'en_US',
      category: 'MARKETING',
      status: 'APPROVED',
      body: 'Hi {{customer_name}}, we have a new property matching your requirements: {{property_name}} in {{property_location}}.',
      variables: ['customer_name', 'property_name', 'property_location']
    },
    {
      provider_template_id: 'temp_124',
      name: 'site_visit_reminder',
      language: 'en_US',
      category: 'UTILITY',
      status: 'APPROVED',
      body: 'Hi {{customer_name}}, a reminder for your site visit on {{visit_date}} with {{agent_name}}.',
      variables: ['customer_name', 'visit_date', 'agent_name']
    }
  ];

  for (const t of providerTemplates) {
    validateTemplateBody(t.body);
    const { data: existing } = await client.from('whatsapp_templates').select('id').eq('provider_template_id', t.provider_template_id).single();
    if (existing) {
      await client.from('whatsapp_templates').update(t).eq('id', existing.id);
    } else {
      await client.from('whatsapp_templates').insert(t);
    }
  }
  logger.info('Templates synced from provider');
};

export const listTemplates = async () => {
  const client = db.getClient();
  const { data, error } = await client.from('whatsapp_templates').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getTemplate = async (id: string) => {
  const client = db.getClient();
  const { data, error } = await client.from('whatsapp_templates').select('*').eq('id', id).single();
  if (error || !data) throw new AppError('Template not found', 404, 'NOT_FOUND');
  return data;
};
