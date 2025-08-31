import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
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
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  driver?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    rating: number;
    college: string;
    phone: string;
  };
}

export interface CreateRideData {
  from_location: string;
  to_location: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  description?: string;
}

export function useRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const fetchRides = async () => {
    console.log("Fetching rides...");
    try {
      setLoading(true);
      const { data, error } = await supabaseClient
  .from("rides")
  .select("*");
  setRides(data as Ride[]); // Temporarily set rides to all fetched data
      console.log("Fetched rides:", data);
      if (error) throw error;

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
      toast.error("Error fetching rides", {
        description: error.message,
      });
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRide = async (rideData: CreateRideData) => {
    if (!user) {
      toast.error("Authentication required", {
        description: "Please sign in to create a ride",
      });
      return { error: new Error("User not authenticated") };
    }

    try {
      const { data, error } = await supabaseClient
        .from("rides")
        .insert([{ ...rideData, driver_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Ride created successfully!", {
        description: "Your ride is now available for booking",
      });

      await fetchRides();
      return { data, error: null };
    } catch (error: any) {
      toast.error("Failed to create ride", {
        description: error.message,
      });
      return { error };
    }
  };

  const bookRide = async (rideId: string, seatsBooked: number) => {
    if (!user) {
      toast.error("Authentication required", {
        description: "Please sign in to book a ride",
      });
      return { error: new Error("User not authenticated") };
    }

    try {
      const { data: ride, error: rideError } = await supabaseClient
        .from("rides")
        .select("*, driver:profiles!rides_driver_id_fkey(full_name)")
        .eq("id", rideId)
        .single();

      if (rideError) throw rideError;

      const totalAmount = ride.price_per_seat * seatsBooked;

      const { data, error } = await supabaseClient
        .from("bookings")
        .insert([
          {
            ride_id: rideId,
            passenger_id: user.id,
            seats_booked: seatsBooked,
            total_amount: totalAmount,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Ride booked successfully!", {
        description: `You've booked ${seatsBooked} seat(s) for ₹${totalAmount}`,
      });

      await fetchRides();
      return { data, error: null };
    } catch (error: any) {
      toast.error("Failed to book ride", {
        description: error.message,
      });
      return { error };
    }
  };

  const completeRide = async (rideId: string) => {
    if (!user) {
      toast.error("Authentication required", {
        description: "Please sign in to complete a ride",
      });
      return { error: new Error("User not authenticated") };
    }

    try {
      const { error } = await supabaseClient
        .from("rides")
        .update({ status: "completed" })
        .eq("id", rideId)
        .eq("driver_id", user.id);

      if (error) throw error;

      toast.success("Ride completed successfully!", {
        description: "Passengers can now rate your service",
      });

      await fetchRides();
      return { error: null };
    } catch (error: any) {
      toast.error("Failed to complete ride", {
        description: error.message,
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  return {
    rides,
    loading,
    fetchRides,
    createRide,
    bookRide,
    completeRide,
  };
}
