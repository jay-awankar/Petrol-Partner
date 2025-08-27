'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Edit3, 
  Star, 
  Camera,
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { RatingsSection } from '@/components/RatingsSection';

// Type for Profile based on your schema
interface Profile {
  id: string;
  full_name: string;
  email?: string;
  college?: string;
  phone?: string;
  bio?: string;
  created_at: string;
  verification_status?: 'verified' | 'pending' | 'rejected';
  rating?: number;
  avatar_url?: string;
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [userStats, setUserStats] = useState({
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0
  });

  const { profile, loading, updateProfile, fetchUserStats } = useProfile();
  const { user } = useUser();

  useEffect(() => {
    const loadStats = async () => {
      const stats = await fetchUserStats();
      if (stats) setUserStats(stats);
    };
    loadStats();
  }, [fetchUserStats]);

  useEffect(() => {
    if (profile) setEditedProfile(profile);
  }, [profile]);

  const handleSave = async () => {
    if (!editedProfile) return;
    
    await updateProfile({
      full_name: editedProfile.full_name,
      college: editedProfile.college,
      phone: editedProfile.phone || '',
      bio: editedProfile.bio || ''
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof Profile, value: string) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [field]: value
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || !editedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h3 className="font-semibold mb-2">Profile not found</h3>
          <p className="text-muted-foreground">Unable to load profile information</p>
        </Card>
      </div>
    );
  }

  const displayRating = editedProfile.rating ? editedProfile.rating.toFixed(1) : "0.0";
  const displayEmail = user?.primaryEmailAddress?.emailAddress || editedProfile.email || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative px-4 pt-3 lg:pt-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Profile</h1>
          </div>
          
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="hover:scale-105 transition-transform duration-200"
          >
            {isEditing ? 'Save' : <><Edit3 className="w-4 h-4 mr-2" />Edit</>}
          </Button>
        </div>
      </header>

      <div className="container relative lg:top-[-50px] mx-auto p-4 space-y-6 max-w-2xl">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar_url || user?.imageUrl} />
                  <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                    {profile.full_name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full">
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-xl font-semibold">{editedProfile.full_name}</h2>
                  <Badge variant={editedProfile.verification_status === 'verified' ? 'default' : 'secondary'}>
                    <Shield className="w-3 h-3 mr-1" />
                    {editedProfile.verification_status === 'verified' ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{displayRating}</span>
                  </div>
                  <span>•</span>
                  <span>{userStats.totalRides} rides</span>
                  <span>•</span>
                  <span>Joined {new Date(editedProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                
                <p className="text-sm text-muted-foreground">{editedProfile.bio || 'No bio added yet'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="hover:shadow-soft hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary animate-pulse">{userStats.completedRides}</div>
              <p className="text-sm text-muted-foreground">Completed Rides</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-soft hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary animate-pulse">{displayRating}</div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Details Tab */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editedProfile.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="college">College</Label>
                <Input
                  id="college"
                  value={editedProfile.college || ''}
                  onChange={(e) => handleInputChange('college', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Input id="email" value={displayEmail} disabled />
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={editedProfile.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editedProfile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!isEditing}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ratings Section */}
        <RatingsSection userId={profile.id} />
      </div>
    </div>
  );
};

export default Profile;
