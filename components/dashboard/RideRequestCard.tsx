import { motion } from 'framer-motion';
import React from 'react'
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge, Clock, MapPin, MessageCircle, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import Avatar from './Avatar';

const RideRequestCard = ({ request, onRespond }: { request: any; onRespond: () => void }) => (
    <motion.div
      key={request.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-soft transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar
                name={request.passenger?.full_name}
                bgClass="bg-gradient-to-br from-secondary to-secondary/80"
                onClick={() => redirect(`/profile/${request.passenger?.id}`)}
              />
              <div>
                <h3 className="font-semibold">{request.passenger?.full_name || 'Unknown Passenger'}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>★ {request.passenger?.avg_rating || 0}</span>
                  <span>•</span>
                  <span>{request.passenger?.college || 'College'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge variant="secondary">Requesting</Badge>
              <span className="text-lg font-bold text-secondary">≤${request.price_per_seat}</span>
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
                <span>{request.requested_seats} passenger{request.requested_seats > 1 ? 's' : ''}</span>
                <span>{request.requested_seats}</span>
              </div>
            </div>
  
            {request.description && <p className="text-sm text-muted-foreground mt-2">{request.description}</p>}
  
            <div className="pt-2">
              <Button variant="outline" className="w-full" onClick={onRespond}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Respond to Request
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

export default RideRequestCard
