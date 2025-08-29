// app/api/get-profile/route.ts
import { currentUser } from '@clerk/nextjs/server';
import { supabaseClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await currentUser(); // gets the logged-in Clerk user
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch profile from database using the user's Clerk ID
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('clerk_id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Return profile ID
    return NextResponse.json({ profileId: profile.id });
  } catch (err) {
    console.error('GET /api/get-profile error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
