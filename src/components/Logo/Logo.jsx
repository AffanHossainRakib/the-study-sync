import { GraduationCap } from "lucide-react";
import Link from "next/link";
import React from "react";

const Logo = () => {
  return (
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
  );
};

export default Logo;
