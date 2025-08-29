"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export interface DashboardStats {
  totalUsers: number;
  totalBookedRides: number;
  dailyRides: number;
  totalActiveRides: number;
  totalRideRequests: number;
  totalRevenue: number;
}

export const useDashboardStats = () => {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBookedRides: 0,
    dailyRides: 0,
    totalActiveRides: 0,
    totalRideRequests: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 100000); // refresh every 100s
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refetch: fetchStats };
};
