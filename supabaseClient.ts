
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hgwoxtzchjetwlnpmfax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnd294dHpjaGpldHdsbnBtZmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTcwNzQsImV4cCI6MjA4MzU3MzA3NH0.Vc8mASD2DuLqR5d3yWlhj1xZM9AZP0GNPeDXSyTXzDg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
