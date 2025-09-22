"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Menu, X, Home, User, Heart, LayoutDashboard } from "lucide-react";

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

  // ✅ Strongly typed nav links
  const navLinks: NavLink[] = [
    { name: "Home", href: "/", icon: <Home /> },
    { name: "Profile", href: "/profile", icon: <User /> },
    { name: "Favorites", href: "/favorites", icon: <Heart /> },
    ...(user?.user_metadata?.role === "seller"
      ? [{ name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard /> }]
      : []),
  ];

  return (
    <nav className="w-full fixed top-0 left-0 bg-[#191919] text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 md:px-12">
        {/* Logo */}
        <h1
          className="text-2xl font-bold cursor-pointer"
          onClick={() => router.push("/")}
        >
          AutoSphere
        </h1>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6 items-center">
          {navLinks.map((link) => (
            <Button
              key={link.name}
              variant="ghost"
              className="flex items-center gap-2 hover:text-black"
              onClick={() => router.push(link.href)}
            >
              {link.icon} {link.name}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="text-black"
          >
            {user ? "Sign Out" : "Sign In"}
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col items-center bg-[#191919] w-full py-4 space-y-4">
          {navLinks.map((link) => (
            <Button
              key={link.name}
              variant="ghost"
              className="flex items-center gap-2 hover:text-blue-500"
              onClick={() => {
                router.push(link.href);
                setMenuOpen(false);
              }}
            >
              {link.icon} {link.name}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="text-black"
          >
            {user ? "Sign Out" : "Sign In"}
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
