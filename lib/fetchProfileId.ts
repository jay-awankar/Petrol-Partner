// lib/fetchProfileId.ts
export async function fetchProfileId(): Promise<string | null> {
    try {
      const res = await fetch('/api/get-profile');
      if (!res.ok) {
        console.error('Failed to fetch profile ID:', res.statusText);
        return null;
      }
  
      const data = await res.json();
      return data.profileId || null;
    } catch (err) {
      console.error('Error fetching profile ID:', err);
      return null;
    }
  }
  