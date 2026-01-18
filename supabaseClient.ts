
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hgwoxtzchjetwlnpmfax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnd294dHpjaGpldHdsbnBtZmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTcwNzQsImV4cCI6MjA4MzU3MzA3NH0.Vc8mASD2DuLqR5d3yWlhj1xZM9AZP0GNPeDXSyTXzDg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: (input, init) => fetch(input, init),
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Utility to check if Supabase is reachable and if the project might be paused.
 */
export const checkCloudHealth = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    // Attempt a lightweight ping with a timeout
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);

    const { error, status } = await supabase
      .from('portfolio_content')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(id);
    
    if (error) {
      if (status === 503 || status === 404) return { ok: false, message: 'Project Paused' };
      if (error.code === 'PGRST301' || error.message.includes('JWT')) return { ok: false, message: 'Auth Mismatch' };
      if (error.code === '42P01') return { ok: false, message: 'Table Missing' };
      return { ok: false, message: 'Cloud Busy' };
    }
    
    return { ok: true, message: 'Cloud Synced' };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('aborted')) {
      return { ok: false, message: 'Cloud Unreachable' };
    }
    return { ok: false, message: 'Offline Mode' };
  }
};
