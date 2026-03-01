import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "some_url"
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : "https://dummy.supabase.co";

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "some_key"
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : "dummy_key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
