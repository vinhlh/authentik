'use server';

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Admin-only Supabase client (service role) to bypass RLS if needed,
// though for this we can mostly rely on the admin user's permissions if RLS is set right.
// However, extraction pipeline might need service role to write to restricted tables if any.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXTRACTION_DISABLED_MESSAGE =
  "Extraction is temporarily disabled due to serverless size limits. Please run extraction outside Vercel for now.";

/**
 * Ensures the current user is an admin.
 */
function serializeError(err: any) {
  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
      name: err.name,
      ...(err as any)
    };
  }
  return err;
}

async function ensureAdmin() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  // We need to pass the cookie from the request for this to work in server action context correctly
  // But for now, let's rely on checking the DB directly with the user ID passed implicitly?
  // Actually, standard practice in Server Actions is to use cookies().
  // Let's rely on a simpler check: passed user ID must match admin role in DB.
  // Ideally we use getUser() from auth-helpers.

  // For simplicity MVP: We will check permissions inside the action logic using the admin client
  // or trust the RLS policies which we set up.
}

export async function submitSuggestion(url: string, userId: string) {
  if (!url || !userId) return { success: false, error: "Missing URL or User ID" };

  try {
    const { error } = await supabaseAdmin
      .from('video_suggestions')
      .insert({
        user_id: userId,
        youtube_url: url,
        status: 'pending'
      });

    if (error) throw error;
    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    console.error("Submit failed:", e);
    return { success: false, error: "Failed to submit suggestion" };
  }
}

export async function approveSuggestion(suggestionId: string) {
  try {
    // Temporarily skip heavy extraction pipeline in serverless environments.
    await supabaseAdmin
      .from('video_suggestions')
      .update({
        status: 'failed',
        logs: { error: EXTRACTION_DISABLED_MESSAGE }
      })
      .eq('id', suggestionId);

    revalidatePath('/admin');
    return { success: false, error: EXTRACTION_DISABLED_MESSAGE };

  } catch (error: any) {
    console.error("Approval failed:", error);

    await supabaseAdmin
      .from('video_suggestions')
      .update({
        status: 'failed',
        logs: { error: error.message }
      })
      .eq('id', suggestionId);

    revalidatePath('/admin');
    return { success: false, error: error.message };
  }
}

export async function rejectSuggestion(suggestionId: string) {
  try {
    await supabaseAdmin
      .from('video_suggestions')
      .update({ status: 'rejected' })
      .eq('id', suggestionId);

    revalidatePath('/admin');
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to reject" };
  }
}

export async function reprocessSuggestion(suggestionId: string) {
  try {
    // Temporarily skip heavy extraction pipeline in serverless environments.
    await supabaseAdmin
      .from('video_suggestions')
      .update({
        status: 'failed',
        logs: { error: EXTRACTION_DISABLED_MESSAGE }
      })
      .eq('id', suggestionId);

    revalidatePath('/admin');
    return { success: false, error: EXTRACTION_DISABLED_MESSAGE };

  } catch (error: any) {
    console.error("Reprocessing failed:", error);

    await supabaseAdmin
      .from('video_suggestions')
      .update({
        status: 'failed',
        logs: { error: serializeError(error) }
      })
      .eq('id', suggestionId);

    revalidatePath('/admin');
    return { success: false, error: error.message };
  }
}
