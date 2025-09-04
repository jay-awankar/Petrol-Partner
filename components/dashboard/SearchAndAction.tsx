'use client'

import React, { useState } from 'react'
import { HandHeart, Plus, Search } from 'lucide-react'
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const SearchAndAction = () => {

    const [searchQuery, setSearchQuery] = useState('');
    const [createRideOpen, setCreateRideOpen] = useState(false);
    const [requestRideOpen, setRequestRideOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              className="flex-1 sm:flex-none"
              onClick={() => setCreateRideOpen(true)}
            >
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
  )
}

export default SearchAndAction
