"use client";

import { supabaseClient } from "@/lib/supabase/client";
import { useAuth, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// ✅ Correct Ride type
type Ride = {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  status: string;
  driver_id: string;
  driver?: {
    id: string;  // changed from user_id
    full_name: string;
    email?: string;
    avatar_url?: string;
    rating?: number;
    college?: string;
  };
  bookings?: { seats_booked: number }[];
};


type CreateRideData = {
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
};

export function useRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const { isSignedIn } = useAuth();
  const { user } = useUser(); // ✅ full Clerk user object

  // Fetch available rides
  const fetchRides = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabaseClient
        .from("rides")
        .select(
          `
    *,
    driver:profiles!rides_driver_id_fkey(
      id,
      full_name,
      email,
      avatar_url
    ),
    bookings(seats_booked)
  `
        )
        .eq("status", "active")
        .order("departure_time", { ascending: true });

      if (error) throw error;

      // Filter rides where seats are still available
      const availableRides = (data || []).filter((ride) => {
        const totalBookedSeats =
          ride.bookings?.reduce(
            (sum: number, booking: any) => sum + booking.seats_booked,
            0
          ) || 0;

        return totalBookedSeats < ride.available_seats;
      });

      setRides(availableRides as Ride[]);
    } catch (error: any) {
      toast.error(`Error fetching rides: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create a ride
  const createRide = async (rideData: CreateRideData) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to create a ride");
      return { error: new Error("User not authenticated") };
    }
  
    try {
      // ✅ fetch profile row for this Clerk user
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)   // Clerk user_id stored in profiles
        .single();
  
      if (profileError || !profile) throw new Error("Profile not found");
  
      const { data, error } = await supabaseClient
        .from("rides")
        .insert([
          {
            ...rideData,
            driver_id: profile.id, // ✅ use profile.id
          },
        ])
        .select()
        .single();
  
      if (error) throw error;
  
      toast.success("Ride created successfully!");
      await fetchRides();
  
      return { data, error: null };
    } catch (error: any) {
      toast.error(`Failed to create ride: ${error.message}`);
      return { error };
    }
  };
  

  // Book a ride
  const bookRide = async (rideId: string, seats: number) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to book a ride");
      return { error: new Error("User not authenticated") };
    }
  
    try {
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
  
      if (profileError || !profile) throw new Error("Profile not found");
  
      const { data, error } = await supabaseClient
        .from("bookings")
        .insert([
          {
            ride_id: rideId,
            user_id: profile.id, // ✅ profile.id not Clerk user.id
            seats_booked: seats,
          },
        ])
        .select()
        .single();
  
      if (error) throw error;
  
      toast.success("Ride booked successfully!");
      await fetchRides();
  
      return { data, error: null };
    } catch (error: any) {
      toast.error(`Failed to book ride: ${error.message}`);
      return { error };
    }
  };
  

  // Complete a ride
  const completeRide = async (rideId: string) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to complete a ride");
      return { error: new Error("User not authenticated") };
    }

    try {
      const { error } = await supabaseClient
        .from("rides")
        .update({ status: "completed" })
        .eq("id", rideId)
        .eq("driver_id", user.id); // only driver can complete

      if (error) throw error;

      toast.success("Ride marked as completed!");
      await fetchRides();

      return { error: null };
    } catch (error: any) {
      toast.error(`Failed to complete ride: ${error.message}`);
      return { error };
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  return { rides, loading, fetchRides, createRide, bookRide, completeRide };
}
