import { motion } from 'framer-motion';
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge, CheckCircle, Clock, MapPin, MessageCircle, Navigation, Star } from 'lucide-react';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import Avatar from './Avatar';

const RideBookedCard = ({ booking, onMessage, onTrack, onRate, onDetails }: { 
  booking: any; 
  onMessage: () => void; 
  onTrack: () => void; 
  onRate: () => void; 
  onDetails: () => void; 
}) => {
  const driver = booking?.ride?.driver;
  const avgRating = driver?.avg_rating ?? 0;
  console.log('Booking:', booking);
  console.log('Driver:', driver);
  console.log('Avg Rating:', avgRating);
  
  return (
    <motion.div
      key={booking.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-soft transition-all duration-300">
        <CardContent className="p-4">
          {/* Driver info and booking summary */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar
                name={driver?.full_name ?? 'Driver'}
                bgClass="bg-gradient-to-br from-green-500 to-green-600"
                onClick={() => driver && redirect(`/profile/${driver.id}`)}
              />
              <div>
                <h3 className="font-semibold">{driver?.full_name || 'Unknown Driver'}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>★ {avgRating.toFixed(1)}</span>
                  <span>•</span>
                  <span>{driver?.college || 'College'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Booked</Badge>
              <span className="text-lg font-bold text-green-600">₹{booking.total_amount}</span>
              <span className="text-xs text-muted-foreground">{booking.seats_booked} seat{booking.seats_booked > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Route info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{booking.ride.from_location}</span>
              <span className="text-muted-foreground">→</span>
              <span>{booking.ride.to_location}</span>
            </div>

            {/* Departure time and status */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(booking.ride.departure_time), 'MMM d, h:mm a')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">{booking.ride.status}</span>
              </div>
            </div>

            {/* Description */}
            {booking.ride.description && <p className="text-sm text-muted-foreground mt-2">{booking.ride.description}</p>}

            {/* Action buttons */}
            <div className="pt-2 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="flex-1 min-w-[100px]" onClick={onMessage}>
                <MessageCircle className="w-4 h-4 mr-2" />Message
              </Button>
              <Button variant="default" size="sm" className="min-w-[100px]" onClick={onTrack}>
                <Navigation className="w-4 h-4 mr-2" />Track Live
              </Button>
              {booking.ride.status === 'completed' && (
                <Button variant="default" size="sm" className="min-w-[100px]" onClick={onRate}>
                  <Star className="w-4 h-4 mr-2" />Rate
                </Button>
              )}
              <Button variant="ghost" size="sm" className="min-w-[100px]" onClick={onDetails}>
                Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RideBookedCard;
