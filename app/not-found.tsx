"use client"
import Link from 'next/link'
import Player from "lottie-react";
import notFound from '../public/not-found/notFound.json';

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      <Player
        autoplay
        loop
        animationData={notFound}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 mt-auto mb-50 mr-auto ml-77 text-center">
        <Link 
          href="/dashboard" 
          className="text-blue-500 hover:text-blue-700 underline text-2xl font-medium"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
