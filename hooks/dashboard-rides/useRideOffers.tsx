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
    avatar_url: string;
    rating: number;
    college: string;
    phone: string;
  };
  isAvailable?: boolean;
}

export interface CreateRideData {
  from_location: string;
  to_location: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  description?: string;
}

export function useRideOffers() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const fetchRides = async () => {
    try {
      setLoading(true);

      // 1️⃣ Fetch rides + driver info
      const { data: ridesData, error } = await supabaseClient
        .from("rides")
        .select(`
          id,
          driver_id,
          from_location,
          to_location,
          departure_time,
          available_seats,
          price_per_seat,
          status,
          description,
          created_at,
          updated_at,
          driver:profiles(id, full_name, avatar_url, college)
        `)
        .order("departure_time", { ascending: false });

      if (error) throw error;
      if (!ridesData) {
        setRides([]);
        return;
      }

      const rideIds = ridesData.map(r => r.id);

      // 2️⃣ Fetch all bookings for these rides
      const { data: bookings, error: bookingsError } = await supabaseClient
        .from("bookings")
        .select("ride_id, seats_booked")
        .in("ride_id", rideIds);

      if (bookingsError) throw bookingsError;

      // 3️⃣ Fetch driver ratings
      const driverIds = ridesData.map(r => r.driver_id);
      const { data: ratings } = await supabaseClient
        .from("profile_ratings")
        .select("profile_id, avg_rating")
        .in("profile_id", driverIds);
        console.log("Ride IDs for bookings fetch:", driverIds);
      console.log("Fetched ratings:", ratings);
      // 4️⃣ Merge bookings and ratings
      const ridesWithInfo = ridesData.map(ride => {
        const totalBookedSeats = bookings
          ?.filter(b => b.ride_id === ride.id)
          .reduce((sum, b) => sum + b.seats_booked, 0) || 0;

        const driverRating = ratings?.find(r => r.profile_id === ride.driver_id);

        return {
          ...ride,
          driver: {
            ...ride.driver,
            rating: driverRating?.avg_rating || 0,
          },
          available_seats: ride.available_seats - totalBookedSeats,
          isAvailable: ride.available_seats - totalBookedSeats > 0,
        };
      });

      setRides(ridesWithInfo);
    } catch (error: any) {
      toast.error("Error fetching rides", { description: error.message });
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
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { data, error } = await supabaseClient
        .from("rides")
        .insert([{ ...rideData, driver_id: profile.id }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Ride created successfully!", {
        description: "Your ride is now available for booking",
      });

      await fetchRides();
      return { data, error: null };
    } catch (error: any) {
      toast.error("Failed to create ride", { description: error.message });
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
      // Check availability dynamically before booking
      const ride = rides.find(r => r.id === rideId);
      if (!ride) throw new Error("Ride not found");
      if (!ride.isAvailable || seatsBooked > ride.available_seats)
        throw new Error(`Not enough seats available. Only ${ride.available_seats} left.`);

      const totalAmount = ride.price_per_seat * seatsBooked;

      const { data, error } = await supabaseClient
        .from("bookings")
        .insert([
          {
            ride_id: rideId,
            passenger_id: user.id,
            seats_booked: seatsBooked,
            total_price: totalAmount,
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
      toast.error("Failed to book ride", { description: error.message });
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
      toast.error("Failed to complete ride", { description: error.message });
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
