"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export interface RideBooking {
  id: string;
  ride_id?: string;
  ride_request_id?: string;
  driver_id: string;
  passenger_id: string;
  seats_booked: number;
  total_amount: number;
  status: string;
  created_at: string;
  ride?: {
    id: string;
    driver_id: string;
    from_location: string;
    to_location: string;
    departure_time: string;
    price_per_seat: number;
    description?: string;
    status: string;
    driver?: {
      id: string;
      full_name: string;
      avatar_url?: string;
      college: string;
      phone: string;
      avg_rating?: number;
    };
  };
  ride_request?: {
    id: string;
    passenger_id: string;
    from_location: string;
    to_location: string;
    preferred_departure_time: string;
    requested_seats: number;
    price_per_seat: number;
    description?: string;
    status: string;
    passenger?: {
      id: string;
      full_name: string;
      avatar_url?: string;
      college: string;
      phone: string;
      avg_rating?: number;
    };
  };
}

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
        .select(`
          *,
          ride:rides (
            *,
            driver:profiles (
              id,
              full_name,
              avatar_url,
              college,
              phone
            )
          ),
          ride_request:ride_requests (
            *,
            passenger:profiles (
              id,
              full_name,
              avatar_url,
              college,
              phone
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookedRides(data || []);
      console.log("Fetched booked rides:", data);
    } catch (err: any) {
      console.error("Error fetching booked rides:", err);
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
        if (booking.ride_request && booking.ride_request.status === "completed") {
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
