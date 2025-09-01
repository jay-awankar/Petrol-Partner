import { supabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { toast } from "sonner"; // ✅ using sonner instead of use-toast

interface BookedRide {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  total_amount: number;
  status: string;
  created_at: string;
  ride: {
    id: string;
    driver_id: string;
    from_location: string;
    to_location: string;
    departure_time: string;
    price_per_seat: number;
    description?: string;
    status: string;
    driver: {
      id: string;
      full_name: string;
      rating: number;
      college: string;
      phone: string;
    };
  };
}

export const useRideBookings = () => {
  const [bookedRides, setBookedRides] = useState<BookedRide[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = useAuth();
  const user = (auth as any)?.user ?? null; // ✅ safe extraction for TS

  const fetchBookedRides = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabaseClient
        .from("bookings")
        .select(
          `
    id,
    ride_id,
    passenger_id,
    seats_booked,
    total_amount,
    status,
    created_at,
    ride:rides (
      id,
      driver_id,
      from_location,
      to_location,
      departure_time,
      status,
      price_per_seat,
      description,
      driver:profiles!rides_driver_id_fkey (
        id,
        full_name,
        ratings!ratings_user_id_fkey(rating)
        college,
        phone
      )
    )
  `
        )
        .eq("passenger_id", user.id) // 👈 must match how you store Clerk ID in profiles/bookings
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching booked rides:", error);
        toast.error(`Error fetching booked rides: ${error.message}`);
        return;
      }

      setBookedRides(data || []);
    } catch (error: any) {
      console.error("Error fetching booked rides:", error);
      toast.error(`Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Check if a ride has been rated by the current user
  const checkIfRated = async (rideId: string, driverId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabaseClient
        .from("ratings")
        .select("id")
        .eq("ride_id", rideId)
        .eq("rater_id", user.id)
        .eq("rated_id", driverId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    } catch (error) {
      console.error("Error checking rating:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchBookedRides();
  }, [user]);

  // ✅ Get completed rides that need rating
  const getCompletedRidesNeedingRating = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabaseClient
        .from("bookings")
        .select(
          `
          *,
          ride:rides!bookings_ride_id_fkey (
            *,
            driver:profiles!rides_driver_id_fkey (
  id,
  full_name,
  college,
  phone,
  ratings:ratings!ratings_user_id_fkey (
    rating
  )
)

          )
        `
        )
        .eq("passenger_id", user.id)
        .eq("status", "confirmed")
        .eq("ride.status", "completed");

      if (error) throw error;

      const unratedRides = [];
      for (const booking of data || []) {
        const hasRated = await checkIfRated(
          booking.ride.id,
          booking.ride.driver_id
        );
        if (!hasRated) {
          unratedRides.push(booking);
        }
      }

      return unratedRides;
    } catch (error: any) {
      console.error("Error fetching completed rides needing rating:", error);
      toast.error(`Error: ${error.message}`);
      return [];
    }
  };

  return {
    bookedRides,
    loading,
    fetchBookedRides,
    checkIfRated,
    getCompletedRidesNeedingRating,
  };
};
