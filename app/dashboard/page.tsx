"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";

import DashboardStats from "@/components/DashboardStats";
// import ActiveRide from "@/components/ActiveRide";
// import SearchAndAction from "@/components/SearchAndAction";

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
    <div className="px-3 md:px-26 py-5 space-y-2 items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <DashboardStats />
      {/* <SearchAndAction />
      <ActiveRide /> */}
    </div>
  );
};

export default Page;
