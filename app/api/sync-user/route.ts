import { currentUser } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("profiles").upsert({
      clerk_id: user.id, // Clerk user ID
      email: user.emailAddresses[0]?.emailAddress || null,
      full_name: user.fullName || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase upsert error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong" }), { status: 500 });
  }
}
