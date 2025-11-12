"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Store,
  Package,
  Users,
  Settings,
  Menu,
  X,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getUser, removeUser, type User } from "@/lib/api"

const USER_UPDATED_EVENT = "user-updated"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sucursales", href: "/dashboard/branches", icon: Store },
  { name: "Productos", href: "/dashboard/products", icon: Package },
  { name: "Usuarios", href: "/dashboard/users", icon: Users },
  { name: "ConfiguraciA3n", href: "/dashboard/settings", icon: Settings }
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getUser())
    }

    const handleUserEvent = () => {
      syncUser()
    }

    syncUser()
    window.addEventListener("storage", handleUserEvent)
    window.addEventListener(USER_UPDATED_EVENT, handleUserEvent as EventListener)

    return () => {
      window.removeEventListener("storage", handleUserEvent)
      window.removeEventListener(USER_UPDATED_EVENT, handleUserEvent as EventListener)
    }
  }, [])

  const initials = useMemo(() => {
    if (!currentUser?.usuario) {
      return "US"
    }
    return currentUser.usuario.slice(0, 2).toUpperCase()
  }, [currentUser])

  const handleLogout = () => {
    removeUser()
    setCurrentUser(null)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(USER_UPDATED_EVENT))
    }
    router.replace("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-primary transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                <Store className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-light text-primary-foreground">VentasApp</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-foreground/10 text-primary-foreground"
                      : "text-primary-foreground/70 hover:bg-primary-foreground/5 hover:text-primary-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-primary-foreground/10 p-4">
            <div className="flex items-center gap-3 rounded-lg px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10">
                <span className="text-sm font-medium text-primary-foreground">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-foreground truncate">
                  {currentUser?.usuario ?? "Usuario sin identificar"}
                </p>
                <p className="text-xs text-primary-foreground/70 truncate">
                  {currentUser?.mail ?? "Sin correo vinculado"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="mt-3 w-full gap-2 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={currentUser ? handleLogout : () => router.replace("/login")}
            >
              <LogOut className="h-4 w-4" />
              {currentUser ? "Cerrar sesiA3n" : "Ir al login"}
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-6 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-serif text-lg font-light">VentasApp</span>
        </header>

        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
