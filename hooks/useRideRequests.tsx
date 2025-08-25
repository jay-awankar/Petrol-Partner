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
      user_id: string;
      full_name: string;
      avatar_url?: string;
      rating: number;
      college: string;
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
    user_id: string;
    full_name: string;
    avatar_url?: string;
    rating: number;
    college: string;
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

      const { data: requestsData, error: requestsError } = await supabaseClient
        .from("ride_requests")
        .select(`
            *,
            ride:ride_id (
            id,
            driver_id,
            from_location,
            to_location,
            departure_time,
            available_seats,
            price_per_seat
            )
        `)
        .eq("status", "active")
        .order("preferred_departure_time", { ascending: true });


      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setRideRequests([]);
        return;
      }

      const passengerIds = [
        ...new Set(requestsData.map((request) => request.passenger_id)),
      ];

      const { data: profilesData, error: profilesError } = await supabaseClient
        .from("profiles")
        .select("user_id, full_name, avatar_url, rating, college")
        .in("user_id", passengerIds);

      if (profilesError) throw profilesError;

      const requestsWithPassengers = requestsData.map((request) => ({
        ...request,
        passenger: profilesData?.find(
          (profile) => profile.user_id === request.passenger_id
        ),
      }));

      setRideRequests(requestsWithPassengers as RideRequest[]);
    } catch (error: any) {
      toast.error("Error fetching ride requests: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptRideRequestResponse = async (
    responseId: string,
    rideRequestId: string
  ) => {
    if (!user) {
      toast.error("Please sign in to accept a ride response");
      return { error: new Error("User not authenticated") };
    }
  
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
  
    if (!profile) {
      toast.error("Profile not found");
      return { error: new Error("Profile not found") };
    }
  
    try {
      const { error: updateError } = await supabaseClient
        .from("ride_requests")
        .update({ status: "booked" })
        .eq("id", rideRequestId)
        .eq("passenger_id", profile.id); // ✅ use profile.id
  
      if (updateError) throw updateError;
  
      const { error: responseError } = await supabaseClient
        .from("ride_request_responses")
        .update({ status: "accepted" })
        .eq("id", responseId);
  
      if (responseError) throw responseError;
  
      toast.success("Ride response accepted! The driver will contact you soon.");
  
      await fetchRideRequests();
      return { error: null };
    } catch (error: any) {
      toast.error("Failed to accept ride response: " + error.message);
      return { error };
    }
  };
  

  const createRideRequest = async (requestData: CreateRideRequestData) => {
    if (!user) {
      toast.error("Please sign in to create a ride request");
      return { error: new Error("User not authenticated") };
    }
  
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
  
    if (!profile) {
      toast.error("Profile not found");
      return { error: new Error("Profile not found") };
    }
  
    try {
      const { data, error } = await supabaseClient
        .from("ride_requests")
        .insert([
          {
            ...requestData,
            passenger_id: profile.id, // ✅ use profile.id
          },
        ])
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
    acceptRideRequestResponse,
  };
}
