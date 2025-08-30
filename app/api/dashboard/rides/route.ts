import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/client";

export async function GET() {
  const { data, error } = await supabaseClient
    .from("rides")
    .select(`
      id,
      from_location,
      to_location,
      departure_time,
      available_seats,
      price_per_seat,
      description,
      driver:profiles!rides_driver_id_fkey (
        id,
        full_name,
        avatar_url,
        college,
        phone,
        ratings:ratings(rating)
      )
    `)
    .eq("status", "active")
    .order("departure_time", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
