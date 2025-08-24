import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Clerk auth (synchronous)
    const session = await auth();
    const userId = session.userId

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    // ----------------------
    // Dashboard Stats Queries
    // ----------------------

    // Total registered users
    const { count: totalUsers, data: TotalUsersData } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
      console.log("Total Users:", totalUsers, TotalUsersData);

    // Total booked rides
    const { count: totalBookedRides } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });
      console.log("Total Booked Rides:", totalBookedRides);

    // Daily rides (rides created today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: dailyRides } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());
      console.log("Daily Rides:", dailyRides);

    // Total active rides
    const { count: totalActiveRides } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
      console.log("Total Active Rides:", totalActiveRides);

    // Total active ride requests
    const { count: totalRideRequests } = await supabase
      .from("ride_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
      console.log("Total Ride Requests:", totalRideRequests);

    // Total revenue from confirmed bookings
    const { data: revenueData, error: revenueError } = await supabase
      .from("bookings")
      .select("total_price")
      .eq("status", "confirmed");

    if (revenueError) throw revenueError;

    const totalRevenue =
      revenueData?.reduce(
        (sum, booking) => sum + (Number(booking.total_price) || 0),
        0
      ) || 0;

    // ----------------------
    // Return all stats
    // ----------------------
    return NextResponse.json({
      totalUsers,
      totalBookedRides,
      dailyRides,
      totalActiveRides,
      totalRideRequests,
      totalRevenue,
    });
  } catch (err) {
    console.error("Stats API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
