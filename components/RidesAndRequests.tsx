import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { CheckCircle, HandHeart, Users } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRides } from '@/hooks/useRides';
import { useBookedRides } from '@/hooks/useBookedRides';
import { useRideRequests } from '@/hooks/useRideRequests';
import { redirect } from 'next/navigation';
import RideOfferCard from './RideOfferCard';
import RideRequestCard from './RideRequestCard';
import BookedRideCard from './BookedRideCard';

// --- Empty State Component ---
const EmptyState = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <Card className="p-8 text-center">
    <div className="text-muted-foreground">
      <Icon className="w-12 h-12 mx-auto mb-4" />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p>{description}</p>
    </div>
  </Card>
);

// --- Main Component ---
const RidesAndRequests = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('offers');

  const { rides, loading: ridesLoading, bookRide, completeRide } = useRides();
  const { bookedRides, loading: bookedRidesLoading, checkIfRated } = useBookedRides();
  const { rideRequests, loading: requestsLoading } = useRideRequests();
  const { user } = useUser();

  const filteredRides = useMemo(() => rides.filter(ride => {
    const matches = [ride.from_location, ride.to_location, ride.driver?.full_name].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()));
    const isBooked = user && bookedRides.some(b => b.ride_id === ride.id);
    return matches && !isBooked;
  }), [rides, bookedRides, searchQuery, user]);

  const filteredRideRequests = useMemo(() => rideRequests.filter(req =>
    [req.from_location, req.to_location, req.passenger?.full_name].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [rideRequests, searchQuery]);

  const filteredBookedRides = useMemo(() => bookedRides.filter(b =>
    [b.ride.from_location, b.ride.to_location, b.ride.driver?.full_name].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [bookedRides, searchQuery]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="offers">Ride Offers ({filteredRides.length})</TabsTrigger>
        <TabsTrigger value="requests">Ride Requests ({filteredRideRequests.length})</TabsTrigger>
        <TabsTrigger value="booked">Booked Rides ({filteredBookedRides.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="offers" className="space-y-4">
        {filteredRides.length === 0
          ? <EmptyState icon={Users} title="No rides available" description="Be the first to offer a ride!" />
          : filteredRides.map((ride) => <RideOfferCard key={ride.id} ride={ride} onBook={() => bookRide(ride.id, 1)} />)
        }
      </TabsContent>

      <TabsContent value="requests" className="space-y-4">
        {filteredRideRequests.length === 0
          ? <EmptyState icon={HandHeart} title="No ride requests" description="Be the first to request a ride!" />
          : filteredRideRequests.map((req) => <RideRequestCard key={req.id} request={req} onRespond={() => {}} />)
        }
      </TabsContent>

      <TabsContent value="booked" className="space-y-4">
        {filteredBookedRides.length === 0
          ? <EmptyState icon={CheckCircle} title="No booked rides" description="Your booked rides will appear here" />
          : filteredBookedRides.map((b) => (
            <BookedRideCard
              key={b.id}
              booking={b}
              onMessage={() => redirect('/chat')}
              onTrack={() => {}}
              onRate={() => {}}
              onDetails={() => {}}
            />
          ))
        }
      </TabsContent>
    </Tabs>
  );
};

export default RidesAndRequests;
