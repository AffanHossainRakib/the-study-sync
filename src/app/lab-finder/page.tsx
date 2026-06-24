import { LabFinder } from "@/components/LabFinder";

export const metadata = {
  title: "Lab Finder | The Study Sync",
  description:
    "Find available CSE lab rooms at BRAC University instantly. Check real-time lab availability by day and time slot.",
};

export default function LabFinderPage() {
  return (
    <div className="min-h-screen animate-fade-in">
      <section className="pt-8 pb-2 px-4 text-center sm:pt-14 sm:pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Lab Finder
        </h1>
        <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground max-w-md mx-auto">
          Find available CSE lab rooms instantly
        </p>
      </section>
      <div className="px-4 pb-12">
        <LabFinder />
      </div>
    </div>
  );
}
