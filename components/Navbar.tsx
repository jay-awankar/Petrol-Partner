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
import Image from "next/image";

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
        <header className="navbar bg-white flex md:hidden px-6 justify-between shadow-md">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icons/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-xl font-bold text-primary">
              Petrol Partner
            </span>
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
        <nav className="navbar hidden md:block bg-white border-b border-border shadow-md">
          <div className="container mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
              src="/icons/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
              <span className="text-2xl font-extrabold text-primary">
                Petrol Partner
              </span>
            </Link>
            <div className="flex items-center space-x-3">
            <Dock items={items} position="top" />
              <SignedOut>
                <SignInButton />
                <SignUpButton>
                  <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </nav>
      </SignedIn>
    </>
  );
}
