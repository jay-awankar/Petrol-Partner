"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";

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
          passenger:profiles(id, full_name, avatar_url, college, phone, avg_rating)
        `)
        .eq("status", "active")
        .order("preferred_departure_time", { ascending: true });

      if (requestsError) throw requestsError;
      if (!requestsData) {
        setRideRequests([]);
        return;
      }

      // 3️⃣ Fetch bookings per ride request
      const requestIds = requestsData.map((r: any) => r.id);
      const { data: bookingsData } = await supabaseClient
        .from("bookings")
        .select("ride_request_id, seats_booked")
        .in("ride_request_id", requestIds)
        .eq("status", "active"); // consider pending bookings

      // 4️⃣ Merge everything
      const mergedRequests: RideRequest[] = requestsData.map((req: any) => {
        const totalBookedSeats = bookingsData
          ?.filter((b: any) => b.ride_request_id === req.id)
          .reduce((sum: number, b: any) => sum + b.seats_booked, 0) || 0;

        return {
          ...req,
          passenger: {
            ...req.passenger,
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
        .eq("clerk_id", user.id)
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
