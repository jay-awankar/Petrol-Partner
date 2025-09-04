"use client";

import { motion } from "framer-motion";
import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge, Clock, MapPin, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import Avatar from "./Avatar";

const RideOfferCard = ({
  ride,
  onBook,
}: {
  ride: any;
  onBook: () => void;
}) => (
  <motion.div
    key={ride.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="hover:shadow-soft transition-all duration-300 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar
              name={ride.driver?.full_name}
              bgClass="bg-gradient-primary"
              onClick={() => redirect(`/profile/${ride.driver?.id}`)}
            />
            <div>
              <h3 className="font-semibold">
                {ride.driver?.full_name || "Unknown Driver"}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>★ {ride.driver?.rating}</span>
                <span>•</span>
                <span>{ride.driver?.college || "College"}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge variant="default">Offering</Badge>
            <span className="text-lg font-bold text-primary">
              ${ride.price_per_seat}
            </span>
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
              <span>
                {format(new Date(ride.departure_time), "MMM d, h:mm a")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>
                {ride.available_seats} seat
                {ride.available_seats > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {ride.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {ride.description}
            </p>
          )}

          <div className="pt-2">
            <Button className="w-full" onClick={onBook}>
              Book Ride
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default RideOfferCard;
