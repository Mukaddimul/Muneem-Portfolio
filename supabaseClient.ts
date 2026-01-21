
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hgwoxtzchjetwlnpmfax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnd294dHpjaGpldHdsbnBtZmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTcwNzQsImV4cCI6MjA4MzU3MzA3NH0.Vc8mASD2DuLqR5d3yWlhj1xZM9AZP0GNPeDXSyTXzDg';

/**
 * Custom fetcher with exponential backoff and significantly increased timeout logic.
 * Retries up to 3 times on failure with optimized delays.
 */
const customFetch = async (input: RequestInfo | URL, init?: RequestInit, retries = 3, backoff = 800): Promise<Response> => {
  const controller = new AbortController();
  // Increased timeout threshold to 30s for resilient session establishment
  const timeoutId = setTimeout(() => controller.abort(), 30000); 

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    // If it's a server error or rate limit, retry with backoff
    if (!response.ok && retries > 0 && [500, 502, 503, 504, 429].includes(response.status)) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return customFetch(input, init, retries - 1, backoff * 2);
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Retry on network errors or timeouts
    if (retries > 0 && (error.name === 'AbortError' || error.name === 'TypeError')) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return customFetch(input, init, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: customFetch,
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Utility to check if Supabase is reachable. 
 * Optimized for speed to reduce initial handshake delays.
 */
export const checkCloudHealth = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const { error, status } = await supabase
      .from('portfolio_content')
      .select('id')
      .eq('id', 'main_config')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      if (status === 503 || status === 404) return { ok: false, message: 'Service Unavailable' };
      if (error.code === 'PGRST301') return { ok: false, message: 'Unauthorized' };
      return { ok: false, message: 'Cloud Latency' };
    }
    
    return { ok: true, message: 'Secure Session Established' };
  } catch (err: any) {
    return { ok: false, message: 'Offline Mode' };
  }
};
