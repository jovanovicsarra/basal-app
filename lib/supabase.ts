import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ulgmwvxtzkocibyjtjkx.supabase.co'

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZ213dnh0emtvY2lieWp0amt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MjczMTYsImV4cCI6MjA4OTUwMzMxNn0.1EXCM-Op4eOrLlaUDI-YXQ4BqOnA2lv-w7U426388S0'

export const supabase = createClient(supabaseUrl, supabaseKey)
