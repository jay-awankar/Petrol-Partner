"use client"
import React, { useState, useEffect, ReactNode } from "react";
import Player from "lottie-react";
import Bike from "../public/loader/Bike.json";

type PageWithLoaderProps = {
  children: ReactNode;
};

export default function PageWithLoader({ children }: PageWithLoaderProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loader for at least 2 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Loader */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50 transition-opacity duration-700">
          <Player
            autoplay
            loop
            animationData={Bike}
            className="w-64 h-64"
          />
        </div>
      )}

      {/* Page content with fade-in */}
      <div
        className={`transition-opacity duration-700 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
