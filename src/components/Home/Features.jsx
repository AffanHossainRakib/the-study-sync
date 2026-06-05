import React from "react";
import {
  Globe,
  Users,
  CheckCircle2,
  Clock,
  RefreshCw,
  Share2,
  Youtube,
  FileText,
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Youtube,
      title: "YouTube Integration",
      description:
        "Auto-import playlists with video titles, durations, and thumbnails using YouTube API.",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: CheckCircle2,
      title: "Global Progress Tracking",
      description:
        "Mark a resource complete once, it stays marked everywhere. Never lose track of what you have learned.",
      iconBg: "bg-info/10",
      iconColor: "text-info",
    },
    {
      icon: Share2,
      title: "Collaborative Plans",
      description:
        "Share study plans with friends via email. Edit together while maintaining individual progress.",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: RefreshCw,
      title: "Reusable Resources",
      description:
        "Already watched a video? Add it to a new plan and it is automatically marked as complete.",
      iconBg: "bg-info/10",
      iconColor: "text-info",
    },
    {
      icon: Clock,
      title: "Smart Time Estimates",
      description:
        "Automatic calculation of total study time. Plan your learning schedule effectively.",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: FileText,
      title: "Multi-Format Support",
      description:
        "Organize YouTube videos, PDFs, slides, and articles all in one centralized location.",
      iconBg: "bg-info/10",
      iconColor: "text-info",
    },
    {
      icon: Users,
      title: "Public & Private",
      description:
        "Keep plans private or share publicly. Clone others' plans to kickstart your learning.",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: Globe,
      title: "Course-Based Organization",
      description:
        "Tag plans with course codes (CSE110, EEE220, etc.) for easy filtering and discovery.",
      iconBg: "bg-info/10",
      iconColor: "text-info",
    },
  ];

  return (
    <section
      id="features"
      className="relative py-12 sm:py-20 lg:py-24 bg-background overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16 animate-fade-in-up">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            Features
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Powerful features designed specifically for self-learners who use
            online resources
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-2 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${100 + index * 50}ms` }}
              >
                {/* Subtle background on hover */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />

                <div className="relative">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl ${feature.iconBg} mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
