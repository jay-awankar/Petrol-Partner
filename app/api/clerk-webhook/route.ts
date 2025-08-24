import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ service role (server only)
);

export async function POST(req: Request) {
  const payload = await req.text();

  // ✅ headers() is synchronous (no await needed)
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: any;
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("❌ Webhook verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = evt;

  if (type === "user.created") {
    try {
      const { id, email_addresses, first_name, last_name, image_url } = data;

      const { error } = await supabaseAdmin.from("profiles").insert({
        id,
        clerk_id: id,
        email: email_addresses?.[0]?.email_address,
        full_name: `${first_name || ""} ${last_name || ""}`.trim(),
        avatar_url: image_url,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ Supabase insert error:", error);
        return new Response("DB insert failed", { status: 500 });
      }
    } catch (err) {
      console.error("❌ Error inserting profile:", err);
      return new Response("Error", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}
