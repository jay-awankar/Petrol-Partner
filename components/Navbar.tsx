"use client";

import Link from "next/link";
import Dock from "@/components/Dock";
import { Home, MessageSquare, User, Wallet, Shield } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Navbar() {
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: <Home /> },
    { href: "/chat", label: "Chat", icon: <MessageSquare /> },
    { href: "/sos", label: "SOS", icon: <Shield /> },
    { href: "/wallet", label: "Wallet", icon: <Wallet /> },
    { href: "/profile", label: "Profile", icon: <User /> },
  ];

  return (
    <>
      {/* Mobile Navbar */}
      <SignedIn>
        <header className="flex md:hidden fixed top-0 left-0 w-full h-15 px-6 items-center justify-between bg-background shadow-md z-50">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-lg">Petrol Partner</span>
          </Link>
          <div>
            <SignedOut>
              <SignInButton>
                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
      </SignedIn>
      <SignedIn>
        <nav className="md:hidden">
          <Dock items={items} position="bottom" />
        </nav>
      </SignedIn>

      {/* Desktop Navbar */}
      <SignedIn>
        <nav className="hidden md:flex sticky top-0 left-0 w-full h-18 px-12 items-center justify-between navbar shadow-md z-50">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-lg">Petrol Partner</span>
          </Link>

          <div className="flex-1 flex justify-center">
            <div className="w-1/2 flex justify-center">
              <Dock items={items} position="top" />
            </div>
          </div>

          <div>
            <SignedOut>
              <SignInButton />
              <SignUpButton>
                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <UserButton />
          </div>
        </nav>
      </SignedIn>
    </>
  );
}
