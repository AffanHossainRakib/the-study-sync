import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  Target,
  Youtube,
  FileText,
  CheckCircle2,
  Share2,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "About",
  description:
    "Learn about The Study Sync — a collaborative study plan manager that helps students organize YouTube videos, PDFs, and articles, track progress, and learn together.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: Youtube,
    title: "Everything in one place",
    description:
      "Mix YouTube videos, PDFs, slides, and articles into a single structured study plan instead of scattering links across tabs and notes.",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: CheckCircle2,
    title: "Progress that sticks",
    description:
      "Mark a resource complete once and it stays complete everywhere. Reuse it in a new plan and it is already done.",
    iconBg: "bg-info/10",
    iconColor: "text-info",
  },
  {
    icon: Share2,
    title: "Built for collaboration",
    description:
      "Share plans with classmates via email, edit together, and still keep your own individual progress.",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Clock,
    title: "Plan your time",
    description:
      "Automatic time estimates from real video durations and reading lengths help you schedule study sessions that actually fit.",
    iconBg: "bg-info/10",
    iconColor: "text-info",
  },
];

const steps = [
  {
    number: "01",
    title: "Create a plan",
    description:
      "Start a study plan for a course or topic and add resources from YouTube, PDFs, and the web.",
  },
  {
    number: "02",
    title: "Start an instance",
    description:
      "Spin up your own instance of any plan with a target end date and track progress at your own pace.",
  },
  {
    number: "03",
    title: "Learn and track",
    description:
      "Check off resources as you go, watch the progress bars fill, and stay on schedule with reminders.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-primary/5 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Hero / Title */}
        <section className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-5">
            <Sparkles className="h-4 w-4" />
            About The Study Sync
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
            Turn scattered resources into a plan you can finish
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            The Study Sync is a collaborative study plan manager for students
            and self-learners. It brings YouTube videos, PDFs, and articles
            together into structured plans with built-in progress tracking,
            time estimates, and sharing — so learning online finally feels
            organized.
          </p>
        </section>

        {/* Mission with image */}
        <section className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-20 sm:mb-24">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl -z-10" />
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-border shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                alt="Students collaborating on a study session"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          <div>
            <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-5">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Our mission
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              So much of modern learning happens on YouTube, in PDFs, and across
              dozens of articles — but the tools to organize it never kept up.
              Learners lose track of what they have watched, forget where they
              left off, and struggle to study together.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We built The Study Sync to fix that: a single home for your
              learning resources, with progress that follows you across plans
              and collaboration that keeps everyone in sync.
            </p>
          </div>
        </section>

        {/* What we offer */}
        <section className="mb-20 sm:mb-24">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
              What makes it different
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              The building blocks that help you actually finish what you start.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="group bg-card border border-border rounded-2xl p-6 hover:shadow-2xl hover:border-primary/30 hover:-translate-y-2 transition-all duration-300"
                >
                  <div
                    className={`inline-flex p-3 rounded-xl ${value.iconBg} mb-4`}
                  >
                    <Icon className={`h-6 w-6 ${value.iconColor}`} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-20 sm:mb-24">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
              How it works
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              From an empty page to a finished course in three steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative bg-card border border-border rounded-2xl p-6 sm:p-8"
              >
                <span className="text-4xl sm:text-5xl font-bold text-primary/20">
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold text-foreground mt-3 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Highlights strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-20 sm:mb-24">
          {[
            { icon: GraduationCap, label: "Course-based plans" },
            { icon: Users, label: "Collaborative sharing" },
            { icon: FileText, label: "Multi-format resources" },
            { icon: CheckCircle2, label: "Global progress tracking" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-3 bg-card border border-border rounded-2xl p-5 sm:p-6"
              >
                <span className="inline-flex p-3 rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </div>
            );
          })}
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12 text-center">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-info/10 rounded-full blur-3xl" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Ready to organize your learning?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-7">
            Browse community plans or create your own in minutes. It is free to
            get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm sm:text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
            >
              Explore Plans
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3 text-sm sm:text-base font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              Sign Up Free
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
