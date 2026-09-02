import { AITool } from '../aiProvider';
import { db } from '../../../database/client';
import { logger } from '../../../utils/logger';

export const checkPropertyAvailabilityToolDefinition: AITool = {
  name: 'checkPropertyAvailability',
  description: 'Checks the real-time availability status of a property. Use this before telling a customer if a property or unit is available, booked, or sold.',
  parameters: {
    type: 'object',
    properties: {
      propertyId: {
        type: 'string',
        description: 'The property UUID to check.',
      },
    },
    required: ['propertyId'],
  },
};

export const executeCheckPropertyAvailability = async (args: string) => {
  try {
    const { propertyId } = JSON.parse(args);
    if (!propertyId) return { error: 'propertyId is required' };

    const client = db.getClient();
    const { data: prop, error } = await client
      .from('properties')
      .select('id, name, title, status')
      .eq('id', propertyId)
      .single();

    if (error || !prop) {
      return { error: 'Property not found' };
    }

    const isAvailable = prop.status === 'available';

    return {
      success: true,
      propertyId: prop.id,
      propertyName: prop.name || prop.title,
      status: prop.status,
      isAvailable,
      message: isAvailable
        ? 'Property is currently available for viewing and purchase.'
        : `Property status is ${prop.status.toUpperCase()} and cannot be booked currently.`,
    };
  } catch (error: any) {
    logger.error({ error: error.message, args }, 'Failed to execute checkPropertyAvailability');
    return { error: error.message };
  }
};
