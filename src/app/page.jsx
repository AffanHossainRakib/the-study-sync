import { Suspense } from "react";
import Hero from "@/components/Home/Hero";
import HowItWorks from "@/components/Home/HowItWorks";
import Features from "@/components/Home/Features";
import PopularPlans from "@/components/Home/PopularPlans";
import Testimonials from "@/components/Home/Testimonials";
import ScrollToTop from "@/components/ScrollToTop";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://thestudysync.vercel.app/#organization",
        name: "The Study Sync",
        url: "https://thestudysync.vercel.app",
        logo: {
          "@type": "ImageObject",
          url: "https://thestudysync.vercel.app/og-image.png",
        },
        description:
          "The Study Sync is a collaborative study plan manager that helps students organize their learning resources, track progress, and achieve their educational goals.",
        sameAs: ["https://github.com/AffanHossainRakib/study-sync"],
      },
      {
        "@type": "WebSite",
        "@id": "https://thestudysync.vercel.app/#website",
        url: "https://thestudysync.vercel.app",
        name: "The Study Sync",
        publisher: {
          "@id": "https://thestudysync.vercel.app/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target:
            "https://thestudysync.vercel.app/plans?search={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebApplication",
        name: "The Study Sync",
        url: "https://thestudysync.vercel.app",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web Browser",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Create, share, and track study plans with built-in progress monitoring, resource management from YouTube, PDFs, and articles, with smart notifications.",
        featureList: [
          "Study Plan Management",
          "YouTube & PDF Integration",
          "Progress Tracking",
          "Collaboration & Sharing",
          "Smart Notifications",
          "Multi-Source Resources",
        ],
        screenshot: "https://thestudysync.vercel.app/og-image.png",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <HowItWorks />
      <Features />
      <Suspense fallback={<div className="py-12 sm:py-20 lg:py-24" />}>
        <PopularPlans />
      </Suspense>
      <Testimonials />
      <ScrollToTop />
    </>
  );
}
