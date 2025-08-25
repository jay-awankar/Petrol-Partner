"use client";

import HeroSection from "@/components/HeroSection";
import FeatureSection from "@/components/FeatureSection";
import CTASection from "@/components/CTASection";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function LandingPage() {

  const { isSignedIn, userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn && !userId) router.replace("/");
    else {
      router.replace("/dashboard");
    }
  }, [isSignedIn, userId, router]);

  if (!isLoaded) return null;

  return (
    <main>
      <HeroSection />
      <FeatureSection />
      <CTASection />
    </main>
  );
}
