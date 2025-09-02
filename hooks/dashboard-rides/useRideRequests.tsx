"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";

export interface Ride {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  available_seats: number;
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
}

export interface RideRequest {
  id: string;
  passenger_id: string;
  from_location: string;
  to_location: string;
  preferred_departure_time: string;
  max_price_per_seat: number;
  passengers_count: number;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;

  passenger?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    college: string;
    phone: string;
    avg_rating?: number; // passenger’s average rating
  };

  ride?: Ride;
}

export interface CreateRideRequestData {
  from_location: string;
  to_location: string;
  preferred_departure_time: string;
  max_price_per_seat: number;
  passengers_count: number;
  description?: string;
}

export function useRideRequests() {
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const fetchRideRequests = async () => {
    try {
      setLoading(true);

      // 1️⃣ Fetch ride requests with passengers + rides + driver
      const { data, error } = await supabaseClient
        .from("ride_requests")
<<<<<<< HEAD
        .select(`
          id,
          passenger:profile_with_ratings (
            id,
            full_name,
            avatar_url,
            college,
            phone,
            avg_rating
          ),
          ride:rides (
            id,
            from_location,
            to_location,
            departure_time,
            driver:profile_with_ratings (
              id,
              full_name,
              avatar_url,
              college,
              phone,
              avg_rating
            )
          )
        `)
        .eq("status", "active")
=======
        .select(
          `
    *,
    ride:ride_id (
      id,
      driver_id,
      from_location,
      to_location,
      departure_time,
      available_seats,
      price_per_seat,
      driver:profiles!rides_driver_id_fkey (
        id,
        full_name,
        avatar_url,
        college,
        phone,
        ratings (
          rating
        )
      )
    )
  `
        )
        .eq("status", "pending")
>>>>>>> ecc52c76fe009fda29e0c9d94d7ef59f82b1ce63
        .order("preferred_departure_time", { ascending: true });

      if (error) throw error;

      setRideRequests(data as RideRequest[]);
    } catch (error: any) {
      toast.error("Error fetching ride requests: " + error.message);
      setRideRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const createRideRequest = async (requestData: CreateRideRequestData) => {
    if (!user) return { error: new Error("User not authenticated") };

    try {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { data, error } = await supabaseClient
        .from("ride_requests")
        .insert([{ ...requestData, passenger_id: profile.id }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Ride request created successfully!");
      await fetchRideRequests();
      return { data, error: null };
    } catch (error: any) {
      toast.error("Failed to create ride request: " + error.message);
      return { error };
    }
  };

  useEffect(() => {
    fetchRideRequests();
  }, []);

  return {
    rideRequests,
    loading,
    fetchRideRequests,
    createRideRequest,
  };
}
