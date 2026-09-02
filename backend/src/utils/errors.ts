export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class WhatsAppProviderError extends AppError {
  public readonly providerErrorCode?: string | number;
  constructor(message = 'WhatsApp provider error', statusCode = 502, code = 'WHATSAPP_PROVIDER_ERROR', providerErrorCode?: string | number) {
    super(message, statusCode, code);
    this.providerErrorCode = providerErrorCode;
  }
}

export class WhatsAppAuthenticationError extends WhatsAppProviderError {
  constructor(message = 'WhatsApp provider authentication failed') {
    super(message, 401, 'WHATSAPP_AUTH_ERROR');
  }
}

export class WhatsAppValidationError extends WhatsAppProviderError {
  constructor(message = 'WhatsApp message validation failed') {
    super(message, 400, 'WHATSAPP_VALIDATION_ERROR');
  }
}

export class WhatsAppRateLimitError extends WhatsAppProviderError {
  constructor(message = 'WhatsApp rate limit exceeded') {
    super(message, 429, 'WHATSAPP_RATE_LIMIT_ERROR');
  }
}

export class WhatsAppTemporaryError extends WhatsAppProviderError {
  constructor(message = 'WhatsApp temporary service error') {
    super(message, 503, 'WHATSAPP_TEMPORARY_ERROR');
  }
}
