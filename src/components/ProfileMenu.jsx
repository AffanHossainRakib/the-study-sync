"use client";

import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import {
  User,
  LayoutDashboard,
  FolderOpen,
  Play,
  Plus,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/dropdown";

/**
 * Navbar profile dropdown (logged-in users, desktop).
 * HeroUI v3 React-Aria menu — satisfies the "advanced dropdown" nav requirement.
 */
export default function ProfileMenu() {
  const router = useRouter();
  const { user, logOut } = useAuth();

  if (!user) return null;

  const isAdmin = user?.role === "admin";
  const go = (href) => () => router.push(href);
  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const Avatar = () =>
    user?.photoURL ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.photoURL}
        alt={user?.displayName || "User"}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20"
      />
    ) : (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <User className="h-4.5 w-4.5" />
      </span>
    );

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label="Open profile menu"
        className="flex items-center gap-1.5 rounded-full p-1 pr-2 text-foreground transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar />
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownTrigger>

      <DropdownPopover placement="bottom end" className="min-w-60">
        <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
          <Avatar />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.displayName || "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        <DropdownMenu aria-label="Profile menu">
          <DropdownItem textValue="Dashboard" onAction={go("/dashboard")}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </DropdownItem>
          <DropdownItem textValue="Create Plan" onAction={go("/create-plan")}>
            <Plus className="h-4 w-4" />
            Create Plan
          </DropdownItem>
          <DropdownItem textValue="My Instances" onAction={go("/instances")}>
            <Play className="h-4 w-4" />
            My Instances
          </DropdownItem>
          <DropdownItem textValue="My Plans" onAction={go("/my-plans")}>
            <FolderOpen className="h-4 w-4" />
            My Plans
          </DropdownItem>
          <DropdownItem textValue="Profile" onAction={go("/profile")}>
            <User className="h-4 w-4" />
            Profile
          </DropdownItem>
          <DropdownItem textValue="Settings" onAction={go("/profile")}>
            <Settings className="h-4 w-4" />
            Settings
          </DropdownItem>
          {isAdmin && (
            <DropdownItem textValue="Admin" onAction={go("/admin")}>
              <Shield className="h-4 w-4" />
              Admin Panel
            </DropdownItem>
          )}
          <DropdownItem
            textValue="Sign out"
            onAction={handleLogout}
            className="text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownItem>
        </DropdownMenu>
      </DropdownPopover>
    </Dropdown>
  );
}
