import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from_location, to_location, preferred_departure_time, requested_seats, price_per_seat, description } = body;

    // ✅ Get current user
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // ✅ Get profile using user's Clerk ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // ✅ Insert ride
    const { data, error } = await supabaseAdmin
      .from("ride_requests")
      .insert([
        {
          from_location,
          to_location,
          preferred_departure_time,
          requested_seats,
          price_per_seat,
          description,
          passenger_id: profile.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting request:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Request created successfully", ride: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
