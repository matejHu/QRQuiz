import { createBrowserClient } from "@supabase/ssr";

// We don't pass the Database generic here — the generated type causes inference
// issues with complex selects. Use explicit type casts at the call site instead.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
