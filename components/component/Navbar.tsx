"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Menu, X, Home, User, Heart, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface NavLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const Navbar = () => {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    if (user) {
      try {
        await signOut();
      } catch (error) {
        console.error(error);
      }
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Nav links
  const navLinks: NavLink[] = [
    { name: "Home", href: "/", icon: <Home /> },
    { name: "Profile", href: "/profile", icon: <User /> },
    { name: "Favorites", href: "/favorites", icon: <Heart /> },
    ...(user?.user_metadata?.role === "seller"
      ? [{ name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard /> }]
      : []),
  ];

  return (
    <nav className="w-full fixed top-0 left-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 md:px-10 text-white">
        <h1
          className="text-2xl md:text-3xl font-extrabold tracking-tight cursor-pointer"
          onClick={() => router.push("/")}
        >
          AutoSphere
        </h1>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-2 text-sm md:text-base text-white/80 hover:text-white transition-colors"
            >
              {link.icon} {link.name}
            </Link>
          ))}
          <Button
            variant="pill"
            onClick={handleSignOut}
            className="ml-2"
          >
            {user ? "Sign Out" : "Sign In"}
          </Button>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile */}
      {menuOpen && (
        <div className="md:hidden flex flex-col items-center w-full py-4 space-y-4 bg-black/60 backdrop-blur border-t border-white/10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-2 text-white/90 hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              {link.icon} {link.name}
            </Link>
          ))}
          <Button
            variant="pill"
            onClick={handleSignOut}
          >
            {user ? "Sign Out" : "Sign In"}
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
