import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";

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

  const subscription = await getUserSubscription(session.user.id);
  const planSlug = subscription?.plan?.slug || "free";

  return (
    <SidebarProvider>
      <AppSidebar userPlan={planSlug} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

