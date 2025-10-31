"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { getUser } from "@/lib/api"

type GuardStatus = "checking" | "authenticated" | "redirecting"

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<GuardStatus>("checking")

  useEffect(() => {
    const storedUser = getUser()

    if (!storedUser) {
      setStatus("redirecting")
      router.replace("/login")
      return
    }

    setStatus("authenticated")
  }, [router])

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          {status === "redirecting" ? "Redirigiendo al inicio de sesión..." : "Validando sesión..."}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
