import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("ride_requests")
      .select("*, requester:profiles(full_name, rating)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ rideRequests: data });
  } catch (err: any) {
    console.error("RideRequests API error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
