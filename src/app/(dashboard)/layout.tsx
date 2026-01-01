import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import { MonitoringProvider } from "@/components/monitoring-provider";
import { QueryProvider } from "@/components/query-provider";

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/auth/signin");
  }

  let planSlug = "free"
  try {
    const subscription = await getUserSubscription(session.user.id);
    if (subscription?.plan?.slug) {
      planSlug = subscription.plan.slug
    }
  } catch (error) {
    console.error("Failed to fetch user subscription in layout:", error)
    // Fallback to free plan on error
  }

  return (
    <QueryProvider>
      <SidebarProvider>
        <MonitoringProvider />
        <AppSidebar userPlan={planSlug} />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  );
}

