import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/header";

const poppins = Poppins({
  subsets: ["latin"],   // add more if needed
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], // all weights
  style: ["normal", "italic"], // supports both
  display: "swap",  // improves performance
  variable: "--font-poppins", // creates a CSS variable
})

export const metadata: Metadata = {
  title: "Petrol Partner",
  description: "College-centric ride sharing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // check if current path is landing page
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";

  const showNavbar = pathname !== "/";

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${poppins.variable} font-sans antialiased min-h-screen bg-gradient-to-b from-blue-50 to-blue-100`}
          >
            {showNavbar === false ? <Header /> : <></>}
          <main className="">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
