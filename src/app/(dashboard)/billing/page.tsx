import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserPlanUsage } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CreditCard, Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

import { ManageSubscriptionButton } from "@/components/manage-subscription-button";

export default async function BillingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  const [{ plan, usage, limits }, rawSubscription] = await Promise.all([
    getUserPlanUsage(session.user.id),
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  // Type for subscription with MP fields (until Prisma is regenerated)
  type SubscriptionWithMP = typeof rawSubscription & {
    mpPreapprovalId?: string | null
    mpCardLastFour?: string | null
    mpCardBrand?: string | null
    mpStatus?: string | null
    mpCurrentPeriodEnd?: Date | null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = rawSubscription as any as SubscriptionWithMP | null;

  const usagePercent = (usage.endpoints / limits.endpoints) * 100;
  const statusPagesPercent = (usage.statusPages / limits.statusPages) * 100;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <div className="flex-1" />
        <h1 className="text-lg font-semibold">Faturamento</h1>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-5xl mx-auto w-full">
        {/* Current Plan */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  Você está atualmente no plano {plan.name}.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                Atual
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-background p-4 border space-y-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">Endpoints</div>
                <div className="text-2xl font-bold">
                  {usage.endpoints} / {limits.endpoints === Infinity ? "∞" : limits.endpoints}
                </div>
                {limits.endpoints !== Infinity && (
                  <Progress value={usagePercent} className="h-2" />
                )}
              </div>
              <div className="rounded-lg bg-background p-4 border space-y-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">Páginas de Status</div>
                <div className="text-2xl font-bold">
                  {usage.statusPages} / {limits.statusPages === Infinity ? "∞" : limits.statusPages}
                </div>
                {limits.statusPages !== Infinity && (
                   <Progress value={statusPagesPercent} className="h-2" />
                )}
              </div>
              <div className="rounded-lg bg-background p-4 border grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Intervalo de Verificação</div>
                  <div className="text-2xl font-bold">{limits.checkInterval} min</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Retenção</div>
                  <div className="text-2xl font-bold">{limits.retention} days</div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 pt-4">
               <h3 className="font-semibold mb-2">Recursos do Plano</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 <div className="flex items-center gap-2 text-sm">
                   {plan.features.customDomain ? <Check className="size-4 text-green-500" /> : <X className="size-4 text-muted-foreground" />}
                   <span>Domínio Personalizado</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                   {plan.features.emailAlerts ? <Check className="size-4 text-green-500" /> : <X className="size-4 text-muted-foreground" />}
                   <span>Alertas por Email</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                   {plan.features.responseAlerts ? <Check className="size-4 text-green-500" /> : <X className="size-4 text-muted-foreground" />}
                   <span>Alertas de Resposta</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                   {plan.features.sslMonitoring ? <Check className="size-4 text-green-500" /> : <X className="size-4 text-muted-foreground" />}
                   <span>Monitoramento SSL</span>
                 </div>
               </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-background/50 px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Faça upgrade para limites maiores e recursos avançados.
            </span>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <a href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/pricing`} target="_blank" rel="noopener noreferrer">Ver todos os planos</a>
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Método de Pagamento</CardTitle>
            <CardDescription>
              Gerencie seus detalhes de pagamento e endereço de cobrança.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-secondary rounded-md">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  {subscription?.mpCardLastFour ? (
                    <>
                      <p className="font-medium">
                        Cartão •••• {subscription.mpCardLastFour}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.mpStatus === "authorized" ? "Assinatura ativa" : 
                         subscription.mpStatus === "paused" ? "Assinatura pausada" :
                         subscription.mpStatus === "cancelled" ? "Assinatura cancelada" :
                         "Gerenciado via Mercado Pago"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Nenhum método de pagamento adicionado</p>
                      <p className="text-sm text-muted-foreground">Gerenciado via Mercado Pago</p>
                    </>
                  )}
                </div>
              </div>
              <ManageSubscriptionButton />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
