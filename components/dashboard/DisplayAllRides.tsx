import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";
import { CheckCircle, HandHeart, Users } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRideOffers } from "@/hooks/dashboard-rides/useRideOffers";
import { useRideBookings } from "@/hooks/dashboard-rides/useRideBookings";
import { useRideRequests } from "@/hooks/dashboard-rides/useRideRequests";
import { redirect } from "next/navigation";
import RideRequestCard from "./RideRequestCard";
import RideBookedCard from "./RideBookedCard";
import RideOfferCard from "./RideOfferCard";

// --- Empty State Component ---
const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <Card className="p-8 text-center">
    <div className="text-muted-foreground">
      <Icon className="w-12 h-12 mx-auto mb-4" />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p>{description}</p>
    </div>
  </Card>
);

// --- Main Component ---
const DisplayAllRides = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("offers");

  const { rides, loading: ridesLoading, bookRide, completeRide } = useRideOffers();
  const {
    bookedRides,
    loading: bookedRidesLoading,
    checkIfRated,
  } = useRideBookings();
  const { rideRequests, loading: requestsLoading } = useRideRequests();
  const { user } = useUser();

  const filteredRidesOffers = useMemo(() => {
    if (!rides) return [];
    return rides.filter((ride) => {
      const matches = [
        ride.from_location,
        ride.to_location,
        ride.driver?.full_name,
      ].some((f) => f?.toLowerCase().includes(searchQuery.toLowerCase()));
      const isBooked = user && bookedRides?.some((b) => b.ride_id === ride.id);
      return matches && !isBooked;
    });
  }, [rides, bookedRides, searchQuery, user]);

  const filteredRideRequests = useMemo(
    () =>
      rideRequests.filter((req) =>
        [req.from_location, req.to_location, req.passenger?.full_name].some(
          (f) => f?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ),
    [rideRequests, searchQuery]
  );

  const filteredRideBookings = useMemo(
    () =>
      bookedRides.filter((b) =>
        [
          b.ride?.from_location,
          b.ride?.to_location,
          b.ride?.driver?.full_name,
          b.ride_request?.from_location,
          b.ride_request?.to_location,
          b.ride_request?.passenger?.full_name,
        ].some((f) => f?.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [bookedRides, searchQuery]
  );
  

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="offers">
          Ride Offers ({filteredRidesOffers.length})
        </TabsTrigger>
        <TabsTrigger value="requests">
          Ride Requests ({filteredRideRequests.length})
        </TabsTrigger>
        <TabsTrigger value="booked">
          Booked Rides ({filteredRideBookings.length})
        </TabsTrigger>
      </TabsList>

      {/* Offered Rides */}
      <TabsContent value="offers" className="space-y-4">
        {ridesLoading ? (
          <p className="text-center text-muted-foreground">Loading rides...</p>
        ) : filteredRidesOffers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No rides available"
            description="Be the first to offer a ride!"
          />
        ) : (
          (filteredRidesOffers || []).map((ride) => (
            <RideOfferCard
              key={ride.id}
              ride={ride}
              onBook={() => bookRide(ride.id, 1)}
            />
          ))
        )}
      </TabsContent>

      {/* --- Requested Rides --- */}
      <TabsContent value="requests" className="space-y-4">
        {requestsLoading ? (
          <p className="text-center text-muted-foreground">
            Loading ride requests...
          </p>
        ) : filteredRideRequests.length === 0 ? (
          <EmptyState
            icon={HandHeart}
            title="No ride requests"
            description="Be the first to request a ride!"
          />
        ) : (
          (filteredRideRequests || []).map((req) => (
            <RideRequestCard key={req.id} request={req} onRespond={() => {}} />
          ))
        )}
      </TabsContent>

      {/* --- Booked Rides --- */}
      <TabsContent value="booked" className="space-y-4">
        {bookedRidesLoading ? (
          <p className="text-center text-muted-foreground">
            Loading booked rides...
          </p>
        ) : filteredRideBookings.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No booked rides"
            description="Your booked rides will appear here"
          />
        ) : (
          (filteredRideBookings || []).map((b) => (
            <RideBookedCard
              key={b.id}
              booking={b}
              onMessage={() => redirect("/chat")}
              onTrack={() => {}}
              onRate={() => {}}
              onDetails={() => {}}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};

export default DisplayAllRides;
