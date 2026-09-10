import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the app has been given its Supabase details. */
export const configured = Boolean(url && key);

export const supabase = createClient(url ?? "https://unconfigured.supabase.co", key ?? "unconfigured", {
  auth: { persistSession: true, autoRefreshToken: true },
});
