"use client";

import { useReducer, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  useRideOffers,
  CreateRideData,
} from "@/hooks/dashboard-rides/useRideOffers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Initial State ---
const initialForm: RideFormState = {
  from_location: "",
  to_location: "",
  departure_time: "",
  available_seats: 1,
  price_per_seat: 0,
  description: "",
  date: undefined,
  time: getNearest5MinTime(),
};

// --- Reducer for form state ---
function formReducer(
  state: RideFormState,
  action: Partial<RideFormState>
): RideFormState {
  return { ...state, ...action };
}

// - -- Helper to get nearest 5 min time slot ---
function getNearest5MinTime(): string {
  const now = new Date();
  const minutes = Math.ceil(now.getMinutes() / 5) * 5;
  if (minutes === 60) {
    now.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    now.setMinutes(minutes, 0, 0);
  }
  const hours = now.getHours().toString().padStart(2, "0");
  const mins = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${mins}`; // always 24h format
}

// --- Component ---
export function RideOfferDialog({ open, onOpenChange }: CreateRideDialogProps) {
  const [formData, dispatch] = useReducer(formReducer, initialForm);
  const [loading, setLoading] = useState(false);
  const { createRide } = useRideOffers();

  const resetForm = () => dispatch(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.time) {
      toast.error("Please select a valid date and time");
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = formData.time.split(":");
      const departureDateTime = new Date(formData.date);
      departureDateTime.setHours(parseInt(hours), parseInt(minutes));

      const rideData: CreateRideData = {
        from_location: formData.from_location.trim(),
        to_location: formData.to_location.trim(),
        departure_time: departureDateTime.toISOString(),
        available_seats: formData.available_seats,
        price_per_seat: formData.price_per_seat,
        description: formData.description?.trim() || "",
      };

      const { error } = await createRide(rideData);

      if (error) {
        toast.error("Failed to create ride. Please try again.");
      } else {
        toast.success("Ride created successfully!");
        onOpenChange(false);
        resetForm();
      }
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Offer a Ride</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From/To Locations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                value={formData.from_location}
                onChange={(e) => dispatch({ from_location: e.target.value })}
                placeholder="Pickup location"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                value={formData.to_location}
                onChange={(e) => dispatch({ to_location: e.target.value })}
                placeholder="Destination"
                required
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 overflow-hidden">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "PP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.date ? new Date(formData.date) : undefined
                    }
                    onSelect={(date) =>
                      dispatch({ ...formData, date: date || undefined })
                    }
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    } // allow today
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select
                onValueChange={(value) => dispatch({ time: value })}
                value={formData.time}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {Array.from({ length: (24 * 60) / 5 }, (_, i) => {
                    const totalMinutes = i * 5;
                    const hours24 = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;

                    const value = `${hours24
                      .toString()
                      .padStart(2, "0")}:${minutes
                      .toString()
                      .padStart(2, "0")}`;

                    const hours12 = hours24 % 12 || 12;
                    const period = hours24 < 12 ? "AM" : "PM";
                    const label = `${hours12}:${minutes
                      .toString()
                      .padStart(2, "0")} ${period}`;

                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seats & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seats">Available Seats</Label>
              <Input
                id="seats"
                type="number"
                min={1}
                max={7}
                value={formData.available_seats}
                onChange={(e) =>
                  dispatch({ available_seats: parseInt(e.target.value) })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per Seat (₹)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={0.01}
                value={formData.price_per_seat}
                onChange={(e) =>
                  dispatch({ price_per_seat: parseFloat(e.target.value) })
                }
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => dispatch({ description: e.target.value })}
              placeholder="Any additional details about the ride..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Ride"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
