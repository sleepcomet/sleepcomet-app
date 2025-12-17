import { LoginForm } from "@/components/login-form"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage(props: Props) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (session) {
    const searchParams = await props.searchParams;
    const plan = searchParams.plan;
    const interval = searchParams.interval;
    
    let redirectUrl = "/";
    if (plan) {
      redirectUrl += `?plan=${plan}`;
      if (interval) {
        redirectUrl += `&interval=${interval}`;
      }
    }
    
    redirect(redirectUrl);
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image src="/logo.svg" alt="Sleepcomet" width={120} height={24} className="invert dark:invert-0 h-6 w-auto" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/placeholder.svg"
          alt="Image"
          fill
          className="absolute inset-0 object-cover"
        />
      </div>
    </div>
  )
}
