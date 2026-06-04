"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import {
  Menu,
  X,
  LogOut,
  User,
  GraduationCap,
  LayoutDashboard,
  FolderOpen,
  Play,
  Star,
  Monitor,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Navbar = () => {
  const { user, loading, logOut } = useAuth();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Navigation links for center section
  const centerLinks = [
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#features", label: "Features" },
    { href: "/#popular-plans", label: "Popular Plans" },
    { href: "/plans", label: "Public Plans" },
    { href: "/lab-finder", label: "Lab Finder" },
  ];

  // Mobile-only user navigation links
  const mobileUserLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/instances", label: "My Instances", icon: Play },
    { href: "/my-plans", label: "My Plans", icon: FolderOpen },
    { href: "/plans", label: "Public Plans", icon: GraduationCap },
    { href: "/lab-finder", label: "Lab Finder", icon: Monitor },
    { href: "/reviews", label: "Add Review", icon: Star },
    { href: "/profile", label: "Profile", icon: User },
  ];

  // Helper to determine if link is active
  const isActive = (path) => pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl shadow-lg border-b border-border"
          : "bg-background/60 backdrop-blur-md border-b border-border/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Left */}
          <div className="shrink-0">
            <Link
              href="/#hero"
              className="flex items-center gap-2.5 group"
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-lg blur-sm opacity-60 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-primary p-2 rounded-lg shadow-md">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <span className="font-bold text-xl text-foreground">
                The Study Sync
              </span>
            </Link>
          </div>

          {/* Center Navigation - Desktop */}
          {!user && (
            <div className="hidden lg:flex lg:items-center lg:gap-1 lg:flex-1 lg:justify-center lg:px-8">
              {centerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap ${
                    isActive(link.href)
                      ? "text-primary bg-primary/10"
                      : "text-foreground hover:text-primary hover:bg-muted"
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full"></span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Right Side - Auth Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {!loading && !user && (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary rounded-lg transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg transition-all duration-300 hover:bg-primary/90 active:scale-95"
                >
                  Sign Up Free
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2.5 text-foreground hover:bg-muted transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background shadow-xl">
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="space-y-1 px-4 py-4">
              {/* Center navigation links */}
              {!user &&
                centerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-lg px-4 py-3 text-base font-medium transition-all ${
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

              {/* User navigation links (mobile only) */}
              {user && (
                <>
                  <div className="my-2 mx-4 border-t border-border" />
                  {mobileUserLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all ${
                          isActive(link.href)
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted hover:text-primary"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </>
              )}
            </div>

            <div className="border-t border-border px-4 py-4 bg-muted/30">
              {!loading && (
                <>
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        {user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user?.displayName || "User"}
                            className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <User className="h-5 w-5 text-primary-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {user.displayName || user.email || "User"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full text-center px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-all"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full text-center px-4 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-lg shadow-md transition-all hover:bg-primary/90 active:scale-95"
                      >
                        Sign Up Free
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
