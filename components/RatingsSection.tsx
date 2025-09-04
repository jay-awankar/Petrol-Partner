"use client";

import { useEffect, useState } from "react";
import { useRatings, RatingWithProfile } from "@/hooks/useRatings";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

interface RatingsSectionProps {
  userId: string; // profile being viewed (rated user)
  rideId?: string; // optional: if rating is linked to a specific ride
}

export function RatingsSection({ userId, rideId }: RatingsSectionProps) {
  const { ratings, averageRating, loading, fetchUserRatings, checkExistingRating, submitRating } =
    useRatings();
  const { user } = useUser();

  const [newRating, setNewRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [hasRated, setHasRated] = useState(false);

  // Load ratings when user profile page loads
  useEffect(() => {
    fetchUserRatings(userId);

    if (rideId && user) {
      checkExistingRating(rideId, userId).then((exists) => {
        setHasRated(!!exists);
      });
    }
  }, [userId, rideId, user]);

  const handleSubmit = async () => {
    if (!rideId) {
      toast.error("Ride information is missing.");
      return;
    }
    if (newRating < 1) {
      toast.error("Please select a rating before submitting.");
      return;
    }

    const { data, error } = await submitRating(
      rideId,
      userId,
      newRating,
      comment
    );

    if (!error && data) {
      // Optimistic update: show the new rating immediately
      fetchUserRatings(userId);
      setHasRated(true);
      setNewRating(0);
      setComment("");
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-2">Ratings & Reviews</h2>

      {loading ? (
        <p className="text-gray-500">Loading ratings...</p>
      ) : (
        <>
          <p className="mb-3">
            <strong>Average Rating:</strong> {averageRating} ⭐
          </p>

          <div className="space-y-3">
            {ratings.map((r: RatingWithProfile) => (
              <div
                key={r.id}
                className="p-3 border rounded-lg bg-gray-50 flex flex-col"
              >
                <span className="font-medium">
                  {r.rater_profile?.full_name || "Anonymous"}
                </span>
                <span>⭐ {r.rating}</span>
                {r.comment && (
                  <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Rating Form (only show if logged in and not already rated) */}
      {user && !hasRated && rideId && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium mb-2">Leave a Rating</h3>

          <div className="flex items-center space-x-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setNewRating(star)}
                className={`text-2xl ${
                  star <= newRating ? "text-yellow-500" : "text-gray-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment (optional)"
            className="w-full border rounded-lg p-2 mb-2"
          />

          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Submit Rating
          </button>
        </div>
      )}

      {!user && (
        <p className="text-sm text-gray-500 mt-3">
          Please sign in to leave a rating.
        </p>
      )}

      {user && hasRated && (
        <p className="text-sm text-green-600 mt-3">
          ✅ You have already rated this user.
        </p>
      )}
    </div>
  );
}
