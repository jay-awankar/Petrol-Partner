'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabaseClient } from '@/lib/supabase/client';
import { useUser } from '@clerk/nextjs'

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser(); // Clerk user

  // 🔹 Fetch profile
  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: profileData, error } = await supabaseClient
        .from('profiles')
        .select("*")
        .eq('clerk_id', user.id) // ✅ using clerk_id
        .single();
      
      if (error) throw error;
      setProfile(profileData as UserProfile);

    } catch (error: any) {
      toast.error('Error fetching profile', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Update profile
  const updateProfile = async (updateData: ProfileUpdateData) => {
    if (!user) {
      toast.error('Authentication required', {
        description: 'Please sign in to update your profile',
      });
      return { error: new Error('User not authenticated') };
    }

    try {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data as UserProfile);
      toast.success('Profile updated successfully!', {
        description: 'Your changes have been saved',
      });

      return { data, error: null };
    } catch (error: any) {
      toast.error('Failed to update profile', {
        description: error.message,
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch user stats (driver + passenger rides)
  const fetchUserStats = async () => {
    if (!profile) return null;

    try {
      // setLoading(true);

      const [driverRides, passengerBookings] = await Promise.all([
        supabaseClient.from('rides').select('id, status').eq('driver_id', profile.id),
        supabaseClient.from('bookings').select('id, status').eq('passenger_id', profile.id),
      ]);

      const totalRides =
        (driverRides.data?.length || 0) +
        (passengerBookings.data?.length || 0);

      const completedRides =
        (driverRides.data?.filter((r) => r.status === 'completed').length || 0) +
        (passengerBookings.data?.filter((b) => b.status === 'completed').length || 0);

      return {
        totalRides,
        completedRides,
        cancelledRides: totalRides - completedRides,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    } finally {
      // setLoading(false);
    }
  };

  // Fetch profile on login
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    fetchUserStats,
  };
}
