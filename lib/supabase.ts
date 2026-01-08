import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://huyhnvklogmrfbctoihf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1eWhudmtsb2dtcmZiY3RvaWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MzYzNzYsImV4cCI6MjA4MzMxMjM3Nn0.kEw3Gju1pFcEPogKRssqtAhGJFHSl0s0puiwzoTEqpk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

