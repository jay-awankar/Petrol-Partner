"use client";

import Link from "next/link";
// import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">Petrol Partner</Link>
        <nav className="flex items-center gap-4">
          <Link href="/rides" className="text-sm">Rides</Link>
          {/* <SignedIn>
            <Link href="/rides/new" className="rounded-lg px-3 py-1.5 bg-black text-white text-sm">Offer a Ride</Link>
            <Link href="/dashboard" className="text-sm">Dashboard</Link>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="text-sm">Sign In</Link>
          </SignedOut> */}
        </nav>
      </div>
    </header>
  );
}
