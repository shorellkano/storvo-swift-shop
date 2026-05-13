import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// PHYSICAL HARDCODED KEYS FOR STORVO SHOP
const SUPABASE_URL = "https://iwpduihkkzijilcdwhyf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cGR1aWhra3ppamlsY2R3aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjU2NTUsImV4cCI6MjA5MDE0MTY1NX0.VjjI2KU2XXScSab5wDq9GosCco7Y6EVghlxDaRonSAo";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
