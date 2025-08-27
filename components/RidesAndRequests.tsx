import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge, CheckCircle, Clock, HandHeart, MapPin, MessageCircle, Navigation, Star, Users } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRides } from '@/hooks/useRides';
import { useBookedRides } from '@/hooks/useBookedRides';
import { useRideRequests } from '@/hooks/useRideRequests';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

const RidesAndRequests = () => {

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('offers');
    const [rideDetailsOpen, setRideDetailsOpen] = useState(false);
    const [selectedRide, setSelectedRide] = useState<string | null>(null);
    const [bookRideOpen, setBookRideOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false);
    const [trackingOpen, setTrackingOpen] = useState(false);
    const [rideToTrack, setRideToTrack] = useState<any>(null);
    const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [selectedRideForDetails, setSelectedRideForDetails] = useState<any>(null);

    const { rides, loading: ridesLoading, bookRide, completeRide } = useRides();
    const { bookedRides, loading: bookedRidesLoading, checkIfRated, getCompletedRidesNeedingRating } = useBookedRides();
    const { rideRequests, loading: requestsLoading } = useRideRequests();
    const { user } = useUser();

    const filteredRides = rides.filter(ride => {
        const matchesSearch = 
          ride.from_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ride.to_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ride.driver?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Exclude rides that the current user has already booked
        const isBooked = user && bookedRides.some(booking => booking.ride_id === ride.id);
        
        return matchesSearch && !isBooked;
      });
    
      const filteredRideRequests = rideRequests.filter(request => {
        const matchesSearch = 
          request.from_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.to_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.passenger?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSearch;
      });
    
      const filteredBookedRides = bookedRides.filter(booking => {
        const matchesSearch = 
          booking.ride.from_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.ride.to_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.ride.driver.full_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSearch;
      });

      const handleRateDriver = async (booking: any) => {
        try {
          const hasRated = await checkIfRated(booking.ride.id, booking.ride.driver_id);
          if (hasRated) {
            console.log('User has already rated this driver');
            return; // Already rated
          }
          setSelectedBooking(booking);
          setRatingDialogOpen(true);
        } catch (error) {
          console.error('Error in handleRateDriver:', error);
        }
      };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="offers">Ride Offers ({filteredRides.length})</TabsTrigger>
            <TabsTrigger value="requests">Ride Requests ({filteredRideRequests.length})</TabsTrigger>
            <TabsTrigger value="booked">Booked Rides ({filteredBookedRides.length})</TabsTrigger>
          </TabsList>

          {/* Ride Offers Tab */}
          <TabsContent value="offers" className="space-y-4 bg-white!important">
            {filteredRides.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No rides available</h3>
                  <p>Be the first to offer a ride!</p>
                </div>
              </Card>
            ) : (
              filteredRides.map((ride, index) => (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className="hover:shadow-soft transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      setSelectedRide(ride.id);
                      setRideDetailsOpen(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              redirect(`/profile/${ride.driver?.user_id}`);
                            }}
                          >
                            {ride.driver?.full_name.split(' ').map(n => n[0]).join('') || 'U'}
                          </div>
                          <div>
                            <h3 className="font-semibold">{ride.driver?.full_name || 'Unknown Driver'}</h3>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>★ {ride.driver?.rating || 0}</span>
                              <span>•</span>
                              <span>{ride.driver?.college || 'College'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant="default">Offering</Badge>
                          <span className="text-lg font-bold text-primary">${ride.price_per_seat}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{ride.from_location}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{ride.to_location}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(ride.departure_time), 'MMM d, h:mm a')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>{ride.available_seats} seat{ride.available_seats > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {ride.description && (
                          <p className="text-sm text-muted-foreground mt-2">{ride.description}</p>
                        )}

                        <div className="pt-2">
                          <Button 
                            className="w-full" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRide(ride.id);
                              setBookRideOpen(true);
                            }}
                          >
                            Book Ride
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Ride Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {filteredRideRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-muted-foreground">
                  <HandHeart className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No ride requests</h3>
                  <p>Be the first to request a ride!</p>
                </div>
              </Card>
            ) : (
              filteredRideRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-soft transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:ring-2 hover:ring-secondary transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              redirect(`/profile/${request.passenger?.user_id}`);
                            }}
                          >
                            {request.passenger?.full_name.split(' ').map(n => n[0]).join('') || 'U'}
                          </div>
                          <div>
                            <h3 className="font-semibold">{request.passenger?.full_name || 'Unknown Passenger'}</h3>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>★ {request.passenger?.rating || 0}</span>
                              <span>•</span>
                              <span>{request.passenger?.college || 'College'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant="secondary">Requesting</Badge>
                          <span className="text-lg font-bold text-secondary">≤${request.max_price_per_seat}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{request.from_location}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{request.to_location}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(request.preferred_departure_time), 'MMM d, h:mm a')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>{request.passengers_count} passenger{request.passengers_count > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {request.description && (
                          <p className="text-sm text-muted-foreground mt-2">{request.description}</p>
                        )}

                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsRespondDialogOpen(true);
                            }}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Respond to Request
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Booked Rides Tab */}
          <TabsContent value="booked" className="space-y-4">
            {filteredBookedRides.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No booked rides</h3>
                  <p>Your booked rides will appear here</p>
                </div>
              </Card>
            ) : (
              filteredBookedRides.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-soft transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              redirect(`/profile/${booking.ride.driver.user_id}`);
                            }}
                          >
                            {booking.ride.driver.full_name.split(' ').map(n => n[0]).join('') || 'U'}
                          </div>
                          <div>
                            <h3 className="font-semibold">{booking.ride.driver.full_name || 'Unknown Driver'}</h3>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>★ {booking.ride.driver.rating || 0}</span>
                              <span>•</span>
                              <span>{booking.ride.driver.college || 'College'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          <Badge 
                            variant="outline" 
                            className="border-green-500 text-green-700 bg-green-50"
                          >
                            Booked
                          </Badge>
                          <span className="text-lg font-bold text-green-600">${booking.total_amount}</span>
                          <span className="text-xs text-muted-foreground">{booking.seats_booked} seat{booking.seats_booked > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{booking.ride.from_location}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{booking.ride.to_location}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(booking.ride.departure_time), 'MMM d, h:mm a')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 font-medium">{booking.status}</span>
                          </div>
                        </div>

                        {booking.ride.description && (
                          <p className="text-sm text-muted-foreground mt-2">{booking.ride.description}</p>
                        )}

                        <div className="pt-2 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => redirect('/chat')}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                          
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setRideToTrack(booking.ride);
                              setTrackingOpen(true);
                            }}
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            Track Live
                          </Button>
                          
                          {booking.status === 'completed' && (
                            <Button 
                              variant="default"
                              size="sm"
                              onClick={async () => {
                                const hasRated = await checkIfRated(booking.ride.id, booking.ride.driver_id);
                                if (!hasRated) {
                                  handleRateDriver(booking);
                                }
                              }}
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Rate
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedRideForDetails(booking.ride);
                              setRideDetailsOpen(true);
                            }}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
  )
}

export default RidesAndRequests
