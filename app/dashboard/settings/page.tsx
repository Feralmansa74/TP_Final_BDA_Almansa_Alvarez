"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Shield,
  TrendingUp,
  User,
  Store
} from "lucide-react"
import {
  changePassword,
  getGeneralKPIs,
  getSucursalesStats,
  getUser,
  getUserById,
  saveUser,
  updateUser,
  type SucursalesStats,
  type User as UserType
} from "@/lib/api"

const USER_UPDATED_EVENT = "user-updated"

interface GeneralKpis {
  ventasTotales: number
  promedioMensual: number
  ventasMesActual: number
  ventasMesAnterior: number
  comparativa: number
  totalTransacciones: number
  totalSucursales: number
  totalProductos: number
}

interface StatusMessage {
  type: "success" | "error"
  message: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [profileForm, setProfileForm] = useState({ usuario: "", mail: "" })
  const [profileStatus, setProfileStatus] = useState<StatusMessage | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [passwordStatus, setPasswordStatus] = useState<StatusMessage | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [generalKpis, setGeneralKpis] = useState<GeneralKpis | null>(null)
  const [branchStats, setBranchStats] = useState<SucursalesStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState("")

  const fetchProfile = useCallback(async (id: number) => {
    try {
      const response = await getUserById(id)
      if (response.success && response.user) {
        setProfileForm({
          usuario: response.user.usuario,
          mail: response.user.mail
        })
      }
    } catch (error) {
      console.error("Error al obtener el perfil:", error)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      setStatsError("")
      const [kpisResponse, sucursalesResponse] = await Promise.all([
        getGeneralKPIs(),
        getSucursalesStats()
      ])

      if (kpisResponse.success && kpisResponse.data) {
        setGeneralKpis(kpisResponse.data)
      } else {
        setGeneralKpis(null)
        setStatsError(kpisResponse.message || "No se pudo obtener el resumen general")
      }

      if (sucursalesResponse.success && sucursalesResponse.data) {
        setBranchStats(sucursalesResponse.data)
      } else {
        setBranchStats(null)
        setStatsError((prev) => prev || sucursalesResponse.message || "Error al obtener las estadisticas de sucursales")
      }
    } catch (error) {
      console.error("Error al obtener estadisticas:", error)
      setGeneralKpis(null)
      setBranchStats(null)
      setStatsError("No se pudieron obtener los indicadores del sistema")
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    const storedUser = getUser()
    if (!storedUser) {
      router.replace("/login")
      return
    }
    setUserId(storedUser.id)
    setProfileForm({
      usuario: storedUser.usuario,
      mail: storedUser.mail
    })
    void fetchProfile(storedUser.id)
    void fetchStats()
  }, [router, fetchProfile, fetchStats])

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!userId) {
      return
    }

    if (!profileForm.usuario.trim() || !profileForm.mail.trim()) {
      setProfileStatus({
        type: "error",
        message: "Completa usuario y correo"
      })
      return
    }

    setProfileLoading(true)
    setProfileStatus(null)

    try {
      const response = await updateUser(userId, {
        usuario: profileForm.usuario.trim(),
        mail: profileForm.mail.trim()
      })

      if (response.success) {
        const updatedUser: UserType = response.user || {
          id: userId,
          usuario: profileForm.usuario.trim(),
          mail: profileForm.mail.trim()
        }

        saveUser(updatedUser)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(USER_UPDATED_EVENT))
        }

        setProfileStatus({
          type: "success",
          message: response.message
        })
      } else {
        setProfileStatus({
          type: "error",
          message: response.message
        })
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      setProfileStatus({
        type: "error",
        message: "No se pudo guardar la informacion"
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!userId) {
      return
    }

    if (!passwordForm.current || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "Completa todos los campos de seguridad"
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "Las contrasenas no coinciden"
      })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordStatus({
        type: "error",
        message: "La nueva contrasena debe tener al menos 8 caracteres"
      })
      return
    }

    setPasswordLoading(true)
    setPasswordStatus(null)

    try {
      const response = await changePassword(
        userId,
        passwordForm.current,
        passwordForm.newPassword
      )

      if (response.success) {
        setPasswordStatus({
          type: "success",
          message: response.message || "Contrasena actualizada"
        })
        setPasswordForm({
          current: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        setPasswordStatus({
          type: "error",
          message: response.message
        })
      }
    } catch (error) {
      console.error("Error al actualizar contrasena:", error)
      setPasswordStatus({
        type: "error",
        message: "No se pudo actualizar la contrasena"
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const generalMetrics = useMemo(() => {
    if (!generalKpis) {
      return []
    }

    return [
      {
        label: "Ventas totales",
        value: generalKpis.ventasTotales,
        formatter: formatCurrency
      },
      {
        label: "Ventas mes actual",
        value: generalKpis.ventasMesActual,
        formatter: formatCurrency
      },
      {
        label: "Promedio mobile 30 dias",
        value: generalKpis.promedioMensual,
        formatter: formatCurrency
      },
      {
        label: "Transacciones historicas",
        value: generalKpis.totalTransacciones,
        formatter: formatNumber
      }
    ]
  }, [generalKpis])

  const branchHighlights = useMemo(() => {
    if (!branchStats) {
      return []
    }

    return [
      {
        label: "Sucursales activas",
        value: branchStats.totalSucursales,
        formatter: formatNumber
      },
      {
        label: "Vendedores en base",
        value: branchStats.totalVendedores,
        formatter: formatNumber
      },
      {
        label: "Stock distribuido",
        value: branchStats.totalProductosEnStock,
        formatter: formatNumber
      },
      {
        label: "Ticket promedio 30 dias",
        value: branchStats.ticketPromedioUltimoMes,
        formatter: formatCurrency
      }
    ]
  }, [branchStats])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Configuracion</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tu perfil y consulta indicadores directamente alimentados por la base de datos.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Perfil</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Los datos se cargan desde la tabla `Usuarios`.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {profileStatus && (
                <div
                  className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                    profileStatus.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-destructive/30 bg-destructive/5 text-destructive"
                  }`}
                >
                  {profileStatus.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{profileStatus.message}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuario</Label>
                  <Input
                    id="usuario"
                    value={profileForm.usuario}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, usuario: event.target.value }))
                    }
                    placeholder="admin"
                    disabled={profileLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={profileForm.mail}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, mail: event.target.value }))
                    }
                    placeholder="usuario@empresa.com"
                    disabled={profileLoading}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={profileLoading}>
                  {profileLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Seguridad</CardTitle>
                <p className="text-sm text-muted-foreground">Actualiza la contrasena almacenada en MySQL.</p>
              </div>
            </CardHeader>
            <CardContent>
              {passwordStatus && (
                <div
                  className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                    passwordStatus.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-destructive/30 bg-destructive/5 text-destructive"
                  }`}
                >
                  {passwordStatus.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="password-current">Contrasena actual</Label>
                  <Input
                    id="password-current"
                    type="password"
                    value={passwordForm.current}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, current: event.target.value }))
                    }
                    placeholder="********"
                    disabled={passwordLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-new">Nueva contrasena</Label>
                  <Input
                    id="password-new"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                    }
                    placeholder="********"
                    disabled={passwordLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-confirm">Confirmar contrasena</Label>
                  <Input
                    id="password-confirm"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                    placeholder="********"
                    disabled={passwordLoading}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar contrasena"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Resumen operativo</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    KPIs generales consultados en tiempo real desde la tabla de Compras y Productos.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => void fetchStats()}
                disabled={statsLoading}
              >
                <RefreshCcw className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              {statsError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{statsError}</span>
                </div>
              )}

              {statsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {generalMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-border/50 bg-card/80 p-4">
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {metric.formatter(metric.value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Salud de sucursales</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Datos consolidados de vendedores, stock y ventas por sucursal.
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Total de sucursales con ventas: {branchStats?.sucursalesConVentas ?? 0} /{" "}
                {branchStats?.totalSucursales ?? 0}
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {branchHighlights.map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-border/50 bg-card/80 p-4">
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {metric.formatter(metric.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {branchStats?.mejorSucursal && (
                    <div className="rounded-xl border border-border/50 bg-primary/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Mejor sucursal del periodo
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {branchStats.mejorSucursal.nombre}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ventas: {formatCurrency(branchStats.mejorSucursal.ventasTotales)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

function formatCurrency(value: number) {
  return currencyFormatter.format(value ?? 0)
}

function formatNumber(value: number) {
  return (value ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })
}
