"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { getUser } from "@/lib/api"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const storedUser = getUser()
    router.replace(storedUser ? "/dashboard" : "/login")
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">Redirigiendo...</p>
    </div>
  )
}
