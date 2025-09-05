"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";

import DashboardStats from "@/components/dashboard/DashboardStats";
import ActiveRide from "@/components/ActiveRide";
import MapComponent from "@/components/dashboard/Map";
import DisplayAllRides from "@/components/dashboard/DisplayAllRides";

const Page = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();

  if (!userId) {
    redirect("/");
  }

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/"); // home page
    } else {
      // Sync user with Supabase
      fetch("/api/sync-user", { method: "POST" }).catch(console.error);
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="page min-h-screen bg-background container mx-auto p-4 space-y-6">
      <DashboardStats />
      <ActiveRide />
      {/* <MapComponent className="h-64" /> */}
      <DisplayAllRides />
    </div>
  );
};

export default Page;
