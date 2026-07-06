import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Cookie-based browser client. Storing the session in cookies (instead of the
// default localStorage) is what lets the server-side auth gatekeeper
// (proxy.ts / middleware) read the session and allow access to /dashboard.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
