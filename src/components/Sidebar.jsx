"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import {
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FolderOpen,
  Play,
  Star,
  Settings,
  GraduationCap,
  Plus,
  Monitor,
  ExternalLink,
} from "lucide-react";
import { getInstances } from "@/lib/api";

const Sidebar = () => {
  const { user, loading, logOut, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize collapsed state from localStorage or default to false
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recentInstances, setRecentInstances] = useState([]);

  // Load instances
  useEffect(() => {
    if (user && token) {
      getInstances(token)
        .then((data) => {
          if (data && data.instances) {
            setRecentInstances(data.instances.slice(0, 5));
          }
        })
        .catch((err) => console.error("Failed to load instances", err));
    }
  }, [user, token, pathname]); // Re-fetch on navigation changes to keep order updated

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Navigation links
  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/my-plans", label: "My Plans", icon: FolderOpen },
    { href: "/instances", label: "My Instances", icon: Play },
    { href: "/plans", label: "All Plans", icon: GraduationCap },
    { href: "/lab-finder", label: "Lab Finder", icon: Monitor },
    { href: "/create-plan", label: "Create New Plan", icon: Plus },
    { href: "/reviews", label: "Add Review", icon: Star },
  ];

  // Admin link
  const adminLinks = [
    { href: "/admin/reviews", label: "View Reviews", icon: Settings },
  ];

  // Helper to determine if link is active
  const isActive = (path) => pathname === path;

  // Don't render if not logged in or still loading
  if (loading || !user) {
    return null;
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 z-40 bg-background border-r border-border transition-all duration-300 ease-in-out hidden lg:flex flex-col ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-6 bg-background border border-border rounded-full p-1 shadow-md hover:bg-muted transition-colors z-50"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title={isCollapsed ? link.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium text-sm truncate">
                    {link.label}
                  </span>
                )}
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {link.label}
                  </div>
                )}
                {isActive(link.href) && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </Link>
            );
          })}

          {/* External Tools */}
          <div
            className={`my-3 mx-3 border-t border-border ${
              isCollapsed ? "mx-1" : ""
            }`}
          />
          {!isCollapsed && (
            <div className="px-3 py-1 mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                External Tools
              </p>
            </div>
          )}
          <a
            href="https://routinebuzz.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative text-muted-foreground hover:text-foreground hover:bg-muted"
            title={isCollapsed ? "RoutineBuzz" : undefined}
          >
            <ExternalLink className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <span className="font-medium text-sm truncate">RoutineBuzz</span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                RoutineBuzz
              </div>
            )}
          </a>

          {/* Quick Access / Recent Instances */}
          {recentInstances.length > 0 && (
            <>
              <div
                className={`my-3 mx-3 border-t border-border ${
                  isCollapsed ? "mx-1" : ""
                }`}
              />
              {!isCollapsed && (
                <div className="px-3 py-1 mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent
                  </p>
                </div>
              )}
              {recentInstances.map((instance) => {
                // Determine title
                const title = (() => {
                  const courseCode =
                    instance.studyPlan?.courseCode || "General";
                  const displayTitle =
                    instance.customTitle ||
                    instance.studyPlan?.title ||
                    "Untitled Instance";
                  return courseCode !== "General"
                    ? `${courseCode} - ${displayTitle}`
                    : displayTitle;
                })();

                const href = `/instances/${instance._id}`;

                return (
                  <Link
                    key={instance._id}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 group relative ${
                      isActive(href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title={isCollapsed ? title : undefined}
                  >
                    <div className="shrink-0 w-5 h-5 flex items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-bold">
                      {title.substring(0, 2).toUpperCase()}
                    </div>
                    {!isCollapsed && <span className="truncate">{title}</span>}
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {title}
                      </div>
                    )}
                  </Link>
                );
              })}
            </>
          )}

          {/* Admin Links */}
          {user?.role === "admin" && (
            <>
              <div
                className={`my-3 mx-3 border-t border-border ${
                  isCollapsed ? "mx-1" : ""
                }`}
              />
              {adminLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title={isCollapsed ? link.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium text-sm truncate">
                        {link.label}
                      </span>
                    )}
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {link.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom Section - User Info & Logout */}
        <div className="border-t border-border p-2">
          {/* User Info */}
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user?.displayName || "User"}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={`w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 ${
                user?.photoURL ? "hidden" : ""
              }`}
            >
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group relative ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <span className="font-medium text-sm">Sign Out</span>
            )}
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Spacer for main content */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      />
    </>
  );
};

export default Sidebar;
