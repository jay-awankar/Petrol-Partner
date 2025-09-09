"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalForms: number;
  totalResponses: number;
  totalUsers: number;
  totalBookedRides: number;
  dailyRides: number;
  totalRideOffers: number;
  totalRevenue: number;
  totalRideRequests: number;
}

export const useDashboardStats = () => {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);

        // ✅ Get Clerk JWT
        const token = await getToken();
        if (!token) throw new Error("No Clerk token found");

        const res = await fetch("/api/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
        const data: DashboardStats = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(err as Error);
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    //initial load with loading state
    fetchStats(true);

    //refresh every 100s without blinking loading
    const interval = setInterval(() => fetchStats(false), 100_000);

    return () => clearInterval(interval);
  }, [getToken]);

  return { stats, loading, error };
};
