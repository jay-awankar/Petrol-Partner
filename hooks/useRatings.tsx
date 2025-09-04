"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { set } from "date-fns";

export interface Rating {
  id: string;
  rater_id: string;
  rated_id: string;
  ride_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface RatingWithProfile extends Rating {
  rater_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

export function useRatings() {
  const [ratings, setRatings] = useState<RatingWithProfile[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  // Fetch ratings for a specific user (as the rated person)
  const fetchUserRatings = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from("ratings")
        .select(
          `
          *,
          rater_profile:profiles!ratings_rater_id_fkey (
            full_name,
            avatar_url
          )
        `
        )
        .eq("rated_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedData = data as RatingWithProfile[];
      setRatings(typedData);

      // ✅ Compute average
      if (typedData.length > 0) {
        const avg =
          typedData.reduce((sum, r) => sum + r.rating, 0) /
          typedData.length;
        setAverageRating(Number(avg.toFixed(1)));
      } else {
        setAverageRating(null);
      }
    } catch (error: any) {
      toast.error("Error fetching ratings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has already rated a specific ride
  const checkExistingRating = async (rideId: string, driverId: string) => {
    if (!user) return null;

    try {
      setLoading(true);

      const { data, error } = await supabaseClient
        .from("ratings")
        .select("id")
        .eq("ride_id", rideId)
        .eq("rater_id", user.id)
        .eq("rated_id", driverId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // not found
      return data;
    } catch (error: any) {
      console.error("Error checking existing rating:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Submit a new rating
  const submitRating = async (
    rideId: string,
    driverId: string,
    rating: number,
    comment?: string
  ) => {
    if (!user) {
      toast.error("Please sign in to submit a rating");
      return { error: new Error("User not authenticated") };
    }

    try {
      setLoading(true);

      const { data, error } = await supabaseClient
        .from("ratings")
        .insert({
          rater_id: user.id,
          rated_id: driverId,
          ride_id: rideId,
          rating: rating,
          comment: comment?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Rating submitted successfully!");
      return { data, error: null };
    } catch (error: any) {
      toast.error("Failed to submit rating: " + error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    ratings,
    averageRating,
    loading,
    fetchUserRatings,
    checkExistingRating,
    submitRating,
  };
}
