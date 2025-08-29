import { motion } from 'framer-motion';
import React from 'react'
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge, CheckCircle, Clock, MapPin, MessageCircle, Navigation, Star } from 'lucide-react';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import Avatar from './Avatar';

const getAverageRating = (ratings?: { rating: number }[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return +(sum / ratings.length).toFixed(1); // rounded to 1 decimal
  };

const BookedRideCard = ({ booking, onMessage, onTrack, onRate, onDetails }: { booking: any; onMessage: () => void; onTrack: () => void; onRate: () => void; onDetails: () => void }) => (
    <motion.div
      key={booking.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-soft transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar
                name={booking.ride.driver?.full_name}
                bgClass="bg-gradient-to-br from-green-500 to-green-600"
                onClick={() => redirect(`/profile/${booking.ride.driver.id}`)}
              />
              <div>
                <h3 className="font-semibold">{booking.ride.driver.full_name || 'Unknown Driver'}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>★ {getAverageRating(booking.ride.driver.ratings)}</span>
                  <span>•</span>
                  <span>{booking.ride.driver.college || 'College'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Booked</Badge>
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
  
            {booking.ride.description && <p className="text-sm text-muted-foreground mt-2">{booking.ride.description}</p>}
  
            <div className="pt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={onMessage}><MessageCircle className="w-4 h-4 mr-2" />Message</Button>
              <Button variant="default" size="sm" onClick={onTrack}><Navigation className="w-4 h-4 mr-2" />Track Live</Button>
              {booking.status === 'completed' && <Button variant="default" size="sm" onClick={onRate}><Star className="w-4 h-4 mr-2" />Rate</Button>}
              <Button variant="ghost" size="sm" onClick={onDetails}>Details</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

export default BookedRideCard
