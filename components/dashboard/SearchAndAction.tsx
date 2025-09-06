'use client';

import React, { useState } from 'react';
import { HandHeart, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RideOfferDialog } from '@/components/dashboard/dialog/RideOfferDialog';
import { RideRequestDialog } from '@/components/dashboard/dialog/RideRequestDialog';

const SearchAndAction = ({ searchQuery, onSearchChange }: SearchAndActionProps) => {
  const [offerRideOpen, setOfferRideOpen] = useState(false);
  const [requestRideOpen, setRequestRideOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search destinations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1 sm:flex-none" onClick={() => setOfferRideOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Offer Ride
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setRequestRideOpen(true)}
          >
            <HandHeart className="w-4 h-4 mr-2" />
            Request Ride
          </Button>
        </div>
      </div>

      {/* Modals */}
      <RideOfferDialog open={offerRideOpen} onOpenChange={setOfferRideOpen} />
      <RideRequestDialog open={requestRideOpen} onOpenChange={setRequestRideOpen} />
    </>
  );
};

export default SearchAndAction;
