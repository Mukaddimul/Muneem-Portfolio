
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hgwoxtzchjetwlnpmfax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnd294dHpjaGpldHdsbnBtZmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTcwNzQsImV4cCI6MjA4MzU3MzA3NH0.Vc8mASD2DuLqR5d3yWlhj1xZM9AZP0GNPeDXSyTXzDg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    // Increased fetch timeout for global client to 30s for stability
    fetch: (input, init) => fetch(input, { ...init, signal: init?.signal || AbortSignal.timeout(30000) }),
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Utility to check if Supabase is reachable. 
 * Optimized to be lightweight and fast.
 */
export const checkCloudHealth = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 10s for health check

    const { error, status } = await supabase
      .from('portfolio_content')
      .select('id')
      .eq('id', 'main_config')
      .limit(1)
      .abortSignal(controller.signal)
      .maybeSingle();
    
    clearTimeout(id);
    
    if (error) {
      if (status === 503 || status === 404) return { ok: false, message: 'Project Paused' };
      if (error.code === 'PGRST301') return { ok: false, message: 'Auth Error' };
      if (error.code === '42P01') return { ok: false, message: 'Table Missing' };
      return { ok: false, message: 'Cloud Busy' };
    }
    
    return { ok: true, message: 'Cloud Active' };
  } catch (err: any) {
    return { ok: false, message: 'Offline' };
  }
};
