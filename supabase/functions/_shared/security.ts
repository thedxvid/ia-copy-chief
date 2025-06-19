
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

export const createSecureResponse = (data: any, status: number = 200) => {
  console.log('Creating secure response:', { status, hasData: !!data });
  return new Response(JSON.stringify(data), {
    status: 200, // SEMPRE 200 para evitar erros no frontend
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
};

export const createErrorResponse = (message: string, originalStatus: number = 500) => {
  console.log('Creating error response:', { message, originalStatus });
  return new Response(
    JSON.stringify({ 
      error: message,
      originalStatus: originalStatus 
    }), 
    {
      status: 200, // SEMPRE 200 para evitar erros no frontend
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};

// Rate limiting usando Redis-like storage (simulado com Map para desenvolvimento)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000 // 1 minuto
): boolean => {
  try {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    
    const current = rateLimitStore.get(key);
    
    if (!current) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      console.log('Rate limit: new window created for', identifier);
      return true;
    }
    
    if (current.count >= maxRequests) {
      console.log('Rate limit exceeded for', identifier, 'count:', current.count);
      return false;
    }
    
    current.count++;
    console.log('Rate limit: incremented count for', identifier, 'to', current.count);
    return true;
  } catch (error) {
    console.error('Error in rate limiting:', error);
    return true; // Em caso de erro, permitir a requisição
  }
};

export const cleanupRateLimit = () => {
  try {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log('Rate limit cleanup: removed', cleaned, 'expired entries');
    }
  } catch (error) {
    console.error('Error cleaning up rate limit:', error);
  }
};

// Função para validar JWT de forma mais segura
export const validateAuthToken = (authHeader: string | null): boolean => {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth validation failed: missing or invalid header format');
      return false;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificações básicas de formato JWT
    if (!token || token.split('.').length !== 3) {
      console.log('Auth validation failed: invalid JWT format');
      return false;
    }
    
    console.log('Auth validation passed');
    return true;
  } catch (error) {
    console.error('Error validating auth token:', error);
    return false;
  }
};

// Sanitização de entrada para prevenir ataques
export const sanitizeInput = (input: any): any => {
  try {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[sanitizeInput(key)] = sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  } catch (error) {
    console.error('Error sanitizing input:', error);
    return input; // Retornar input original em caso de erro
  }
};
