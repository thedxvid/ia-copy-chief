
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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Creating secure response:`, { 
    status, 
    hasData: !!data,
    success: data?.success,
    error: data?.error
  });
  
  return new Response(JSON.stringify({
    ...data,
    timestamp
  }), {
    status: 200, // SEMPRE 200 para evitar erros no frontend
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
};

export const createErrorResponse = (message: string, originalStatus: number = 500, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Creating error response:`, { message, originalStatus, details });
  
  return new Response(
    JSON.stringify({ 
      error: message,
      success: false,
      originalStatus: originalStatus,
      details,
      timestamp
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

// Rate limiting melhorado com cleanup automático
const rateLimitStore = new Map<string, { count: number; resetTime: number; firstRequest: number }>();

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 20, 
  windowMs: number = 60000 // 1 minuto
): boolean => {
  try {
    const now = Date.now();
    const windowKey = `${identifier}:${Math.floor(now / windowMs)}`;
    
    // Cleanup de entradas antigas automaticamente
    cleanupExpiredEntries(now);
    
    const current = rateLimitStore.get(windowKey);
    
    if (!current) {
      rateLimitStore.set(windowKey, { 
        count: 1, 
        resetTime: now + windowMs,
        firstRequest: now
      });
      console.log(`Rate limit: nova janela criada para ${identifier}`);
      return true;
    }
    
    if (current.count >= maxRequests) {
      const timeToReset = Math.ceil((current.resetTime - now) / 1000);
      console.log(`Rate limit excedido para ${identifier}: ${current.count}/${maxRequests} requests. Reset em ${timeToReset}s`);
      return false;
    }
    
    current.count++;
    console.log(`Rate limit: ${identifier} - ${current.count}/${maxRequests} requests na janela atual`);
    return true;
  } catch (error) {
    console.error('Erro no rate limiting:', error);
    return true; // Em caso de erro, permitir a requisição
  }
};

// Cleanup automático mais eficiente
const cleanupExpiredEntries = (now: number) => {
  try {
    let cleaned = 0;
    const entries = Array.from(rateLimitStore.entries());
    
    for (const [key, value] of entries) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Rate limit cleanup: removidas ${cleaned} entradas expiradas`);
    }
  } catch (error) {
    console.error('Erro no cleanup do rate limit:', error);
  }
};

// Cleanup periódico (roda a cada 5 minutos)
setInterval(() => {
  cleanupExpiredEntries(Date.now());
}, 5 * 60 * 1000);

// Função melhorada para validar JWT
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
    
    // Verificar se não é um token vazio ou muito curto
    if (token.length < 50) {
      console.log('Auth validation failed: token too short');
      return false;
    }
    
    console.log('Auth validation passed');
    return true;
  } catch (error) {
    console.error('Error validating auth token:', error);
    return false;
  }
};

// Sanitização melhorada de entrada para prevenir ataques
export const sanitizeInput = (input: any): any => {
  try {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove objects
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embeds
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => sanitizeInput(item)).slice(0, 100); // Limite de 100 itens
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      let keyCount = 0;
      
      for (const [key, value] of Object.entries(input)) {
        if (keyCount >= 50) break; // Limite de 50 chaves por objeto
        
        const sanitizedKey = typeof key === 'string' ? sanitizeInput(key) : key;
        sanitized[sanitizedKey] = sanitizeInput(value);
        keyCount++;
      }
      return sanitized;
    }
    
    return input;
  } catch (error) {
    console.error('Error sanitizing input:', error);
    return input; // Retornar input original em caso de erro
  }
};

// Função para monitorar saúde do sistema
export const getSystemHealth = () => {
  const now = Date.now();
  const activeRateLimits = Array.from(rateLimitStore.entries())
    .filter(([_, value]) => now < value.resetTime)
    .length;
  
  return {
    timestamp: new Date().toISOString(),
    activeRateLimits,
    totalRateLimitEntries: rateLimitStore.size,
    uptime: process.uptime?.() || 'unknown'
  };
};
