"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Mail,
  Send,
  Github,
  Twitter,
  Linkedin,
  Youtube,
  GraduationCap,
} from "lucide-react";
import Logo from "./Logo/Logo";

const Footer = () => {
  /*
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Placeholder for newsletter subscription
    if (email) {
      setSubscribeStatus("Thanks for subscribing!");
      setEmail("");
      setTimeout(() => setSubscribeStatus(""), 3000);
    }
  };
  */

  const footerSections = {
    product: {
      title: "Product",
      links: [
        { label: "Features", href: "/#features" },
        { label: "How It Works", href: "/#how-it-works" },
        { label: "Public Plans", href: "/plans" },
        { label: "Create Plan", href: "/create-plan" },
      ],
    },
    more: {
      title: "More from us",
      links: [
        { label: "Lab Buddy", href: "https://bracu-lab-buddy.pages.dev/" },
        { label: "RoutineBuzz", href: "https://routinebuzz.vercel.app/" },
      ],
    },
    /*
    resources: {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Help Center", href: "#" },
        { label: "API", href: "#" },
      ],
    },
    community: {
      title: "Community",
      links: [
        { label: "Discord", href: "#" },
        { label: "Twitter", href: "#" },
        { label: "GitHub", href: "#" },
        { label: "Support", href: "#" },
      ],
    },
    company: {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Contact", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
      ],
    },
    */
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-8 lg:gap-12 mb-8 sm:mb-12">
          {/* Brand Column */}
          <div className="lg:max-w-sm">
            <div className=" mb-4">
              <Logo />
            </div>

            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Centralize your learning journey. Organize YouTube playlists,
              PDFs, and articles in one powerful platform with smart progress
              tracking.
            </p>

            {/* Social Links */}
            {/* <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div> */}
          </div>

          {/* Links Columns */}
          <div className="flex gap-8 sm:gap-12 flex-wrap">
            {Object.values(footerSections).map((section) => (
              <div key={section.title} className="min-w-[140px]">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Section */}
        {/* <div className="border-t border-border pt-6 sm:pt-8 mb-6 sm:mb-8">
          <div className="max-w-md">
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">
              Subscribe to our newsletter
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Get the latest updates, study tips, and feature announcements.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs sm:text-sm hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-sm"
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </form>
            {subscribeStatus && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                {subscribeStatus}
              </p>
            )}
          </div>
        </div> */}

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} The Study Sync. All rights reserved.
          </p>
          {/* <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Cookies
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
