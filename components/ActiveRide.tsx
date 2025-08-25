"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, Clock, Navigation } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import { useRides } from "@/hooks/useRides";
import { useRideRequests } from "@/hooks/useRideRequests";
import { useBookedRides } from "@/hooks/useBookedRides";
import { toast } from "sonner";

const ActiveRide = () => {
  const { userId } = useAuth();
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [rideToTrack, setRideToTrack] = useState<any>(null);

  const { rides, loading: ridesLoading } = useRides();
  const { rideRequests, loading: requestsLoading } = useRideRequests();
  const { bookedRides, loading: bookedRidesLoading } = useBookedRides();

  if (ridesLoading || requestsLoading || bookedRidesLoading) {
    return <p className="text-sm text-muted-foreground">Loading your rides...</p>;
  }

  // Passenger bookings
  const activePassengerBooking = bookedRides
    ?.filter(
      (b) =>
        (b.status === "confirmed" || b.status === "pending") &&
        b.ride?.status === "active"
    )
    .sort(
      (a, b) =>
        new Date(a.ride?.departure_time || 0).getTime() -
        new Date(b.ride?.departure_time || 0).getTime()
    )[0];

  // Driver rides
  const driverActiveRide = rides
    ?.filter((r) => r.driver_id === userId && r.status === "active")
    .sort(
      (a, b) =>
        new Date(a.departure_time).getTime() -
        new Date(b.departure_time).getTime()
    )[0];

  // Requested rides
  const pendingRequest = rideRequests
    ?.filter((req) => req.status === "pending" && req.ride)
    .sort(
      (a, b) =>
        new Date(a.ride?.departure_time || 0).getTime() -
        new Date(b.ride?.departure_time || 0).getTime()
    )[0];

  // Decide active ride
  const activeRide = activePassengerBooking?.ride
    ?? driverActiveRide
    ?? pendingRequest?.ride
    ?? null;

  const isDriverForActiveRide = !!activeRide && userId === activeRide.driver_id;

  return (
    <Card className="hover:shadow-soft transition-all duration-300 py-5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Active Ride</span>
          {isDriverForActiveRide && <Badge variant="secondary">Driver</Badge>}
          {!isDriverForActiveRide && activePassengerBooking && (
            <Badge variant="secondary">Passenger</Badge>
          )}
          {!isDriverForActiveRide && pendingRequest && (
            <Badge variant="outline">Requested</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeRide ? (
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{activeRide.from_location}</span>
                <span className="text-muted-foreground">→</span>
                <span>{activeRide.to_location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {activeRide.departure_time
                    ? format(new Date(activeRide.departure_time), "MMM d, h:mm a")
                    : "No departure time"}
                </span>
                {!isDriverForActiveRide && activeRide.driver?.full_name && (
                  <>
                    <span>•</span>
                    <span>Driver: {activeRide.driver.full_name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setRideToTrack(activeRide);
                  setTrackingOpen(true);
                  toast.success("Tracking started for this ride");
                }}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Track Live
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No active ride right now. Book, request, or offer a ride to start.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveRide;
