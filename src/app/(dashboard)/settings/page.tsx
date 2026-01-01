"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ThemeSelect } from "@/components/theme-select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const { data: session, isPending: isLoading } = authClient.useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
      setImage(session.user.image || null)
    }
  }, [session])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const presignRes = await fetch("/api/uploads/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || "application/octet-stream" }),
      })
      if (!presignRes.ok) { 
        toast.error("Falha ao obter URL de upload")
        setIsUploading(false)
        return 
      }
      const { uploadUrl, fileUrl } = await presignRes.json()
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })
      if (!putRes.ok) { 
        toast.error("Falha ao enviar imagem")
        setIsUploading(false)
        return 
      }
      
      await authClient.updateUser({
        image: fileUrl
      })
      
      setImage(fileUrl)
      toast.success("Avatar atualizado com sucesso")
    } catch (err) {
      toast.error("Ocorreu um erro")
      console.error(err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await authClient.updateUser({
        name: name
      })
      toast.success("Perfil atualizado com sucesso")
    } catch (err) {
      toast.error("Falha ao atualizar perfil")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <div className="flex-1" />
        <h1 className="text-lg font-semibold">Configurações</h1>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-4xl mx-auto w-full">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Gerencie seu perfil público e detalhes da conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              {isLoading ? (
                <div className="h-20 w-20 flex items-center justify-center rounded-full bg-muted">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Avatar className="h-20 w-20">
                  <AvatarImage src={image || "/avatars/shadcn.jpg"} alt="@user" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
              )}
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleAvatarClick} disabled={isUploading}>{isUploading ? (<Loader2 className="size-4 animate-spin" />) : ("Alterar Avatar")}</Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome de Exibição</Label>
                {isLoading ? (
                  <div className="flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-1 shadow-sm">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isLoading ? (
                  <div className="flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-1 shadow-sm">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Input id="email" autoComplete="email" value={email} disabled />
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="size-4 animate-spin" /> : "Salvar Alterações"}</Button>
          </CardFooter>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>
              Personalize a aparência do painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Tema</Label>
                <div className="text-sm text-muted-foreground">
                  Selecione o tema para o painel.
                </div>
              </div>
              <ThemeSelect />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>
              Configure como você recebe alertas e atualizações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="email-alerts">Alertas por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba emails quando endpoints monitorados ficarem fora do ar.
                </p>
              </div>
              <Switch
                id="email-alerts"
                checked={emailAlerts}
                onCheckedChange={setEmailAlerts}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
