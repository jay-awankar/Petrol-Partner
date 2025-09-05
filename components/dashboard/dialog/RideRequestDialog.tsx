'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, MapPin, Users, IndianRupee } from 'lucide-react';
import { useRideRequests, CreateRideRequestData } from '@/hooks/dashboard-rides/useRideRequests';

interface RequestRideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RideRequestDialog = ({ open, onOpenChange }: RequestRideDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateRideRequestData>({
    from_location: '',
    to_location: '',
    preferred_departure_time: '',
    price_per_seat: 20,
    requested_seats: 1,
    description: '',
  });

  const { createRideRequest } = useRideRequests();

  // Generic input change handler
  const handleChange = (key: keyof CreateRideRequestData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload: CreateRideRequestData = {
      ...formData,
      preferred_departure_time: new Date(formData.preferred_departure_time).toISOString(),
    };

    const result = await createRideRequest(payload);

    if (!result.error) {
      onOpenChange(false);
      setFormData({
        from_location: '',
        to_location: '',
        preferred_departure_time: '',
        price_per_seat: 20,
        requested_seats: 1,
        description: '',
      });
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Request a Ride</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Location */}
          <div className="space-y-2">
            <Label htmlFor="from" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>From</span>
            </Label>
            <Input
              id="from"
              placeholder="Pickup location"
              value={formData.from_location}
              onChange={(e) => handleChange('from_location', e.target.value)}
              required
            />
          </div>

          {/* To Location */}
          <div className="space-y-2">
            <Label htmlFor="to" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>To</span>
            </Label>
            <Input
              id="to"
              placeholder="Destination"
              value={formData.to_location}
              onChange={(e) => handleChange('to_location', e.target.value)}
              required
            />
          </div>

          {/* Preferred Departure Time */}
          <div className="space-y-2">
            <Label htmlFor="departure" className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Preferred Departure Time</span>
            </Label>
            <Input
              id="departure"
              type="datetime-local"
              value={formData.preferred_departure_time}
              min={new Date().toISOString().slice(0, 16)} // prevent past datetime
              onChange={(e) => handleChange('preferred_departure_time', e.target.value)}
              required
            />
          </div>

          {/* Passengers Count and Max Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passengers" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Passengers</span>
              </Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max="6"
                value={formData.requested_seats}
                onChange={(e) => handleChange('requested_seats', parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPrice" className="flex items-center space-x-2">
                <IndianRupee className="w-4 h-4" />
                <span>Max Price/Seat</span>
              </Label>
              <Input
                id="maxPrice"
                type="number"
                min="0"
                step="0.50"
                value={formData.price_per_seat}
                onChange={(e) => handleChange('price_per_seat', parseFloat(e.target.value) || 20)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Notes (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Any special requirements or notes for drivers..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Request Ride'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
