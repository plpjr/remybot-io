import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://szxdrpllzngbpiyktipe.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eGRycGxsem5nYnBpeWt0aXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzAxNjEsImV4cCI6MjA3NDE0NjE2MX0.mJ4u8ubBfGKfMgvJciQzYrGCvLKRy7dGw4GHBYQE29k";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
