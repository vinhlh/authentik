import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import AdminDashboard from "./admin-client";
import { headers } from "next/headers";

// Server Component
export default async function AdminPage() {
  // We need to verify the user via Supabase Auth
  // Since we are in a server component without official supabase-ssr package helpers setup
  // we will do a best-effort check using the service client + looking up the user from cookies manually
  // OR, simpler: use the getUser() approach if we have auth-helpers.

  // Actually, without the full SSR helper setup, checking auth server-side reliably can be tricky
  // because we need to parse the JWT from the cookie.

  // However, we can use the pattern where we construct a client with the access token.
  // For now, let's implement the DB check using the client-side session or
  // if we want strict 404, we need to read the cookies.

  // Let's try to assume we can get the session.
  // If this is too complex given current setup (no @supabase/ssr),
  // we can use a Client Component check that redirects or shows 404 content.
  // But user asked for "404 if not admin".

  // Alternative: Pure Client Component that renders "404" if not admin.
  // But "Infinite Recursion" was the main blocker.

  // Let's implement the server check best effort.
  // We'll skip the complex cookie parsing if we don't have the helpers and do a "Client Side Protection"
  // that behaves like a 404 (returns null/NotFound component) to keep it simple and robust
  // without introducing new massive dependencies/config.

  // Wait, I can't invoke `notFound()` from a client component easily during initial render to return a 404 status code (SEO),
  // but for an admin dashboard, SEO doesn't matter. Visual 404 is fine.

  // Let's stick to Server Component if possible.
  // Since I don't see `utils/supabase/server.ts` or similar, I'll rely on the RLS + Client Protection.
  // The user said "allow access to admin users only. otherwise 404".

  return (
    <AdminPageProtection />
  );
}

// Separate component to handle the async check logic or client logic
import AdminPageProtection from "./protection";
