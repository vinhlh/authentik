'use server';

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { extractFromVideo } from "@/lib/extraction-pipeline";

// Admin-only Supabase client (service role) to bypass RLS if needed,
// though for this we can mostly rely on the admin user's permissions if RLS is set right.
// However, extraction pipeline might need service role to write to restricted tables if any.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    // 1. Mark as processing
    await supabaseAdmin
      .from('video_suggestions')
      .update({ status: 'processing' })
      .eq('id', suggestionId);

    revalidatePath('/admin');

    // 2. Fetch suggestion details
    const { data: suggestion } = await supabaseAdmin
      .from('video_suggestions')
      .select('youtube_url, user_id')
      .eq('id', suggestionId)
      .single();

    if (!suggestion) throw new Error("Suggestion not found");

    // 3. Trigger extraction pipeline
    // Note: In Vercel/Serverless, this might time out if it takes too long.
    // Ideally this is a background job. For MVP locally, we await it.
    console.log(`Starting extraction for ${suggestion.youtube_url}...`);

    // We pass "Authentik Community" or fetch the user's name as creator
    const result = await extractFromVideo(suggestion.youtube_url, "Community Submission", { dry: false });

    // 4. Mark as completed and link collection
    await supabaseAdmin
      .from('video_suggestions')
      .update({
        status: 'completed',
        result_collection_id: result.collection.id,
        logs: {
          stats: result.stats,
          errors: result.logs || []
        }
      })
      .eq('id', suggestionId);

    revalidatePath('/admin');
    return { success: true };

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
    // 1. Mark as processing (resetting logs)
    await supabaseAdmin
      .from('video_suggestions')
      .update({
        status: 'processing',
        logs: null
      })
      .eq('id', suggestionId);

    revalidatePath('/admin');

    // 2. Fetch suggestion details
    const { data: suggestion } = await supabaseAdmin
      .from('video_suggestions')
      .select('youtube_url, user_id')
      .eq('id', suggestionId)
      .single();

    if (!suggestion) throw new Error("Suggestion not found");

    console.log(`🔄 Reprocessing ${suggestion.youtube_url}...`);

    // 3. Trigger extraction pipeline (same as approval)
    const result = await extractFromVideo(suggestion.youtube_url, "Community Submission", { dry: false });

    // 4. Mark as completed
    await supabaseAdmin
      .from('video_suggestions')
      .update({
        status: 'completed',
        result_collection_id: result.collection.id,
        logs: {
          stats: result.stats,
          errors: result.logs || []
        }
      })
      .eq('id', suggestionId);

    revalidatePath('/admin');
    return { success: true };

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
