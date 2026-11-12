import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kqoytxpgcvkfcvojmktk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb3l0eHBnY3ZrZmN2b2pta3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0OTgxNTYsImV4cCI6MjExMDA3NDE1Nn0.AH6aWAgJJnAMyrpAARMhBs2GqW46_p7_7D02RvNjiRk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
