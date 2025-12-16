import { FadeIn } from "@/components/animations/fade-in";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <FadeIn className="h-full w-full">
      {children}
    </FadeIn>
  );
}
