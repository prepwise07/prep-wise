import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "some_url"
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : "https://placeholder.supabase.co";

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "some_key"
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : "placeholder_key";

let supabase: ReturnType<typeof createBrowserClient> | undefined;

export function createSupabaseBrowserClient() {
    if (!supabase) {
        supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return supabase;
}
