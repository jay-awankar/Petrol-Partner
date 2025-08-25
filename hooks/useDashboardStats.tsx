import { useState, useEffect } from "react";

interface DashboardStats {
  totalUsers: number;
  totalBookedRides: number;
  dailyRides: number;
  totalActiveRides: number;
  totalRideRequests: number;
  totalRevenue: number;
}

export const useDashboardStats = () => {
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
      const res = await fetch("/api/dashboard/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");

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

    // Optional: set interval to refresh stats every 30s
    const interval = setInterval(fetchStats, 100000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refetch: fetchStats };
};
