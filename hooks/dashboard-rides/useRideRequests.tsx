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
  };
}

export interface RideRequest {
  id: string;
  passenger_id: string;
  from_location: string;
  to_location: string;
  preferred_departure_time: string;
  requested_seats: number;
  price_per_seat: number;
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
    avg_rating?: number;
  };
  ride?: Ride;
  seatsAvailable?: boolean;
}

export interface CreateRideRequestData {
  from_location: string;
  to_location: string;
  preferred_departure_time: string;
  requested_seats: number;
  price_per_seat: number;
  description?: string;
}

export function useRideRequests() {
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const fetchRideRequests = async () => {
    try {
      setLoading(true);

      // 1️⃣ Fetch ride requests + passenger info
      const { data: requestsData, error: requestsError } = await supabaseClient
        .from("ride_requests")
        .select(`
          *,
          passenger:profiles(id, full_name, avatar_url, college, phone)
        `)
        .eq("status", "active")
        .order("preferred_departure_time", { ascending: true });

      if (requestsError) throw requestsError;
      if (!requestsData) {
        setRideRequests([]);
        return;
      }

      // 2️⃣ Fetch passenger ratings
      const passengerIds = requestsData.map((r: any) => r.passenger_id);
      const { data: ratingsData } = await supabaseClient
        .from("profile_ratings")
        .select("profile_id, avg_rating")
        .in("profile_id", passengerIds);

      // 3️⃣ Fetch bookings per ride request
      const requestIds = requestsData.map((r: any) => r.id);
      const { data: bookingsData } = await supabaseClient
        .from("bookings")
        .select("ride_request_id, seats_booked")
        .in("ride_request_id", requestIds)
        .eq("status", "pending"); // consider pending bookings

      // 4️⃣ Merge everything
      const mergedRequests: RideRequest[] = requestsData.map((req: any) => {
        const ratingEntry = ratingsData?.find((r: any) => r.profile_id === req.passenger_id);
        const totalBookedSeats = bookingsData
          ?.filter((b: any) => b.ride_request_id === req.id)
          .reduce((sum: number, b: any) => sum + b.seats_booked, 0) || 0;

        return {
          ...req,
          passenger: {
            ...req.passenger,
            avg_rating: ratingEntry?.avg_rating ?? 0,
          },
          seatsAvailable: totalBookedSeats < req.requested_seats,
        };
      });

      setRideRequests(mergedRequests);
    } catch (error: any) {
      toast.error("Error fetching ride requests: " + error.message);
      setRideRequests([]);
      console.error(error);
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
