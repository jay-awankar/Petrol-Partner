"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export function useRideBookings() {
  const [bookedRides, setBookedRides] = useState<RideBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const fetchBookedRides = async () => {
    if (!user) return setLoading(false);

    try {
      setLoading(true);

      // 1️⃣ Get user's profile ID
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      if (profileError || !profile) throw new Error("Profile not found");

      // 2️⃣ Fetch bookings + rides + ride_requests + driver/passenger
      const { data, error } = await supabaseClient
        .from("bookings")
        .select(
          `
          *,
          ride:rides (
            id,
            from_location,
            to_location,
            departure_time,
            description,
            status,
            driver:profiles(
              id,
              full_name,
              avatar_url,
              college,
              phone,
              avg_rating
            )
          ),
          ride_request:ride_requests (
            id,
            from_location,
            to_location,
            preferred_departure_time,
            description,
            status,
            passenger:profiles(
              id,
              full_name,
              avatar_url,
              college,
              phone,
              avg_rating
            )
          )
        `
        )
        .or(`passenger_id.eq.${profile.id},driver_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookedRides(data || []);
    } catch (err: any) {
      toast.error(`Error fetching booked rides: ${err.message}`);
      setBookedRides([]);
    } finally {
      setLoading(false);
    }
  };

  const checkIfRated = async (bookingId: string, ratedId: string) => {
    if (!user) return false;
    try {
      const { data, error } = await supabaseClient
        .from("ratings")
        .select("id")
        .eq("rater_id", user.id)
        .eq("rated_id", ratedId)
        .eq("booking_id", bookingId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    } catch {
      return false;
    }
  };

  const getCompletedRidesNeedingRating = async () => {
    if (!user) return [];
    try {
      const unrated: RideBooking[] = [];
      for (const booking of bookedRides) {
        if (booking.ride && booking.ride.status === "completed") {
          const rated = await checkIfRated(booking.id, booking.ride.driver_id);
          if (!rated) unrated.push(booking);
        }
        if (
          booking.ride_request &&
          booking.ride_request.status === "completed"
        ) {
          const rated = await checkIfRated(
            booking.id,
            booking.ride_request.passenger_id
          );
          if (!rated) unrated.push(booking);
        }
      }
      return unrated;
    } catch (err) {
      console.error("Error fetching rides needing rating:", err);
      return [];
    }
  };

  useEffect(() => {
    fetchBookedRides();
  }, [user]);

  return {
    bookedRides,
    loading,
    fetchBookedRides,
    checkIfRated,
    getCompletedRidesNeedingRating,
  };
}
