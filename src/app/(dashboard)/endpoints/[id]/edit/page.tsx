"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Globe, Clock, Bell, Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function EditEndpoint({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  // Form state
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [interval, setInterval] = useState("30")
  const [requestTimeout, setRequestTimeout] = useState("30")
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [sslVerification, setSslVerification] = useState(true)

  // Fetch endpoint data
  useEffect(() => {
    const fetchEndpoint = async () => {
      try {
        const res = await fetch(`/api/endpoints/${id}`)
        if (!res.ok) {
          toast.error("Falha ao carregar endpoint")
          router.push("/")
          return
        }
        const endpoint = await res.json()
        setName(endpoint.name || "")
        setUrl(endpoint.url || "")
        setInterval(endpoint.checkInterval?.toString() || "30")
        setRequestTimeout(endpoint.requestTimeout?.toString() || "30")
        setAlertsEnabled(endpoint.alertsEnabled ?? true)
        setSslVerification(endpoint.sslVerification ?? true)
      } catch {
        toast.error("Erro ao carregar endpoint")
        router.push("/")
      } finally {
        setIsFetching(false)
      }
    }

    fetchEndpoint()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`/api/endpoints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          url,
          checkInterval: parseInt(interval),
          requestTimeout: parseInt(requestTimeout),
          alertsEnabled,
          sslVerification
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        toast.error(error.message || "Falha ao atualizar endpoint")
        setIsLoading(false)
        return
      }
      
      toast.success("Endpoint atualizado com sucesso")
      router.push(`/endpoints/${id}`)
    } catch {
      toast.error("Erro ao atualizar endpoint")
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Loader2 className="size-12 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Carregando endpoint...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <Link href={`/endpoints/${id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <div className="flex-1" />
        <h1 className="text-lg font-semibold">Editar Endpoint</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="size-4" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Atualize os detalhes do endpoint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    autoComplete="off"
                    placeholder="ex: API Produção"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Um nome amigável para identificar este endpoint
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    autoComplete="off"
                    placeholder="https://api.example.com/health"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL completa para monitorar (deve incluir https:// ou http://)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Monitoring Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="size-4" />
                  Configurações de Monitoramento
                </CardTitle>
                <CardDescription>
                  Configure a frequência e como este endpoint é verificado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="interval">Intervalo de Checagem</Label>
                  <Select value={interval} onValueChange={setInterval}>
                    <SelectTrigger id="interval">
                      <SelectValue placeholder="Selecione o intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">A cada 15 segundos</SelectItem>
                      <SelectItem value="30">A cada 30 segundos</SelectItem>
                      <SelectItem value="60">A cada 1 minuto</SelectItem>
                      <SelectItem value="300">A cada 5 minutos</SelectItem>
                      <SelectItem value="600">A cada 10 minutos</SelectItem>
                      <SelectItem value="1800">A cada 30 minutos</SelectItem>
                      <SelectItem value="3600">A cada 1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Com que frequência verificaremos este endpoint
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout da Requisição</Label>
                  <Select value={requestTimeout} onValueChange={setRequestTimeout}>
                    <SelectTrigger id="timeout">
                      <SelectValue placeholder="Selecione o timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 segundos</SelectItem>
                      <SelectItem value="10">10 segundos</SelectItem>
                      <SelectItem value="15">15 segundos</SelectItem>
                      <SelectItem value="30">30 segundos</SelectItem>
                      <SelectItem value="60">60 segundos</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Tempo máximo para aguardar uma resposta
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Alerts & Security */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="size-4" />
                  Alertas e Segurança
                </CardTitle>
                <CardDescription>
                  Configure notificações e configurações de segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="alerts">Habilitar Alertas</Label>
                    <p className="text-xs text-muted-foreground">
                      Receba notificações quando este endpoint ficar offline
                    </p>
                  </div>
                  <Switch
                    id="alerts"
                    checked={alertsEnabled}
                    onCheckedChange={setAlertsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="ssl">Verificação SSL</Label>
                      <Shield className="size-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Verificar validade do certificado SSL (recomendado)
                    </p>
                  </div>
                  <Switch
                    id="ssl"
                    checked={sslVerification}
                    onCheckedChange={setSslVerification}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href={`/endpoints/${id}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading || !name || !url}>
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
