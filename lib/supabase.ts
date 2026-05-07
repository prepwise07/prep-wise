import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Only initialize if we have the keys, or provide dummy strings to prevent build failure
// Vercel build environment might not have these keys during the 'collecting page data' phase
const finalUrl = supabaseUrl || "https://placeholder-url.supabase.co";
const finalKey = supabaseKey || "placeholder-key";

export const supabase = createClient(finalUrl, finalKey);
