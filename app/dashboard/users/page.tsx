"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  getAllUsers,
  deleteUser,
  getUserStats,
  type User,
  type UsersStats
} from "@/lib/api"
import {
  Users,
  Search,
  Trash2,
  Edit,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Home,
  Shield,
  UserPlus,
  Clock3,
  AlertTriangle,
  PieChart
} from "lucide-react"

const EMPTY_STATS: UsersStats = {
  totalUsuarios: 0,
  nuevosUltimaSemana: 0,
  nuevosUltimoMes: 0,
  nuevosMesAnterior: 0,
  crecimientoMensual: 0,
  promedioAntiguedadDias: 0,
  usuariosSinEmail: 0,
  usuarioMasReciente: null,
  usuarioMasAntiguo: null,
  dominiosPrincipales: []
}

const formatDate = (value?: string | null) => {
  if (!value) return "Sin registro"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Sin registro"
  return parsed.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

const formatAccountAge = (value?: string | null) => {
  if (!value) return "N/D"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "N/D"
  const diffDays = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)))
  if (diffDays === 0) return "Hoy"
  if (diffDays < 7) {
    return `${diffDays} dia${diffDays === 1 ? "" : "s"}`
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} semana${weeks === 1 ? "" : "s"}`
  }
  const months = diffDays / 30
  if (months < 12) {
    return `${months.toLocaleString("es-AR", { maximumFractionDigits: 1 })} meses`
  }
  const years = months / 12
  return `${years.toLocaleString("es-AR", { maximumFractionDigits: 1 })} anios`
}

const formatAverageAge = (days: number) => {
  if (!Number.isFinite(days) || days <= 0) return "Sin datos"
  if (days < 30) {
    const rounded = Math.round(days)
    return `${rounded} dia${rounded === 1 ? "" : "s"}`
  }
  const months = days / 30
  if (months < 12) {
    return `${months.toLocaleString("es-AR", { maximumFractionDigits: 1 })} meses`
  }
  const years = months / 12
  return `${years.toLocaleString("es-AR", { maximumFractionDigits: 1 })} anios`
}

const formatPercentage = (value: number) => {
  const formatted = Math.abs(value).toLocaleString("es-AR", { maximumFractionDigits: 1 })
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  return `${sign}${formatted}%`
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<UsersStats>({ ...EMPTY_STATS })
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    void loadUsers()
    void loadStats()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
      return
    }

    const lower = searchTerm.toLowerCase()
    setFilteredUsers(
      users.filter(
        (user) =>
          user.usuario.toLowerCase().includes(lower) ||
          user.mail.toLowerCase().includes(lower)
      )
    )
  }, [searchTerm, users])

  const loadUsers = async () => {
    setIsLoading(true)
    setErrorMessage("")

    const response = await getAllUsers()
    if (response.success && response.users) {
      setUsers(response.users)
      setFilteredUsers(response.users)
    } else {
      setErrorMessage(response.message || "No fue posible obtener los usuarios")
    }

    setIsLoading(false)
  }

  const loadStats = async () => {
    const response = await getUserStats()
    if (response.success && response.stats) {
      const data = response.stats
      setStats({
        totalUsuarios: data.totalUsuarios ?? 0,
        nuevosUltimaSemana: data.nuevosUltimaSemana ?? 0,
        nuevosUltimoMes: data.nuevosUltimoMes ?? 0,
        nuevosMesAnterior: data.nuevosMesAnterior ?? 0,
        crecimientoMensual: data.crecimientoMensual ?? 0,
        promedioAntiguedadDias: data.promedioAntiguedadDias ?? 0,
        usuariosSinEmail: data.usuariosSinEmail ?? 0,
        usuarioMasReciente: data.usuarioMasReciente ?? null,
        usuarioMasAntiguo: data.usuarioMasAntiguo ?? null,
        dominiosPrincipales: data.dominiosPrincipales ?? []
      })
    } else {
      setStats({ ...EMPTY_STATS })
    }
  }

  const handleDeleteUser = async (id: number, username: string) => {
    const confirmed = confirm(`Seguro que deseas eliminar al usuario "${username}"?`)
    if (!confirmed) return

    setErrorMessage("")
    setSuccessMessage("")

    const response = await deleteUser(id)
    if (response.success) {
      setSuccessMessage(`Usuario "${username}" eliminado correctamente`)
      await loadUsers()
      await loadStats()
      setTimeout(() => setSuccessMessage(""), 3000)
    } else {
      setErrorMessage(response.message || "No se pudo eliminar el usuario")
    }
  }

  const growthIsPositive = stats.crecimientoMensual >= 0
  const growthColorClass =
    stats.crecimientoMensual === 0
      ? "text-muted-foreground"
      : growthIsPositive
        ? "text-emerald-600"
        : "text-rose-600"

  const missingEmailPercent = useMemo(() => {
    if (stats.totalUsuarios === 0) return 0
    return (stats.usuariosSinEmail / stats.totalUsuarios) * 100
  }, [stats.totalUsuarios, stats.usuariosSinEmail])

  const newestUser = stats.usuarioMasReciente
  const oldestUser = stats.usuarioMasAntiguo
  const topDomains = stats.dominiosPrincipales ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
              </Link>
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-serif tracking-tight text-foreground">
                  Gestion de Usuarios
                </h1>
                <p className="text-sm text-muted-foreground">
                  Administra los usuarios del sistema
                </p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Ir al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total usuarios</p>
                  <p className="text-3xl font-light text-foreground">{stats.totalUsuarios}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stats.totalUsuarios === 1 ? "Cuenta activa" : "Cuentas activas"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10">
                  <UserPlus className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ultima semana</p>
                  <p className="text-3xl font-light text-foreground">{stats.nuevosUltimaSemana}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nuevos registros en los ultimos 7 dias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Calendar className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ultimo mes</p>
                  <p className="text-3xl font-light text-foreground">{stats.nuevosUltimoMes}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 text-sm ${growthColorClass}`}>
                {stats.crecimientoMensual === 0 ? (
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                ) : growthIsPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{formatPercentage(stats.crecimientoMensual)} vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10">
                  <Clock3 className="h-7 w-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Antiguedad promedio</p>
                  <p className="text-3xl font-light text-foreground">
                    {formatAverageAge(stats.promedioAntiguedadDias)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Tiempo medio desde el alta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="h-5 w-5 text-primary" />
                Movimiento de usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ultimo registro
                </p>
                {newestUser ? (
                  <div className="mt-1">
                    <p className="text-sm font-medium text-foreground">{newestUser.usuario}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(newestUser.fechaCreacion)}</p>
                    {newestUser.mail && (
                      <p className="text-xs text-muted-foreground">{newestUser.mail}</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Sin registros recientes</p>
                )}
              </div>
              <div className="rounded-lg border border-dashed border-border/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Primer registro
                </p>
                {oldestUser ? (
                  <div className="mt-1">
                    <p className="text-sm font-medium text-foreground">{oldestUser.usuario}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(oldestUser.fechaCreacion)}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Sin registros</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/10">
                  <AlertTriangle className="h-7 w-7 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendientes de email</p>
                  <p className="text-3xl font-light text-foreground">{stats.usuariosSinEmail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {missingEmailPercent.toLocaleString("es-AR", { maximumFractionDigits: 1 })}% del total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-5 w-5 text-primary" />
                Dominios principales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topDomains.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin correos registrados</p>
              ) : (
                <ul className="space-y-2">
                  {topDomains.map((domain) => (
                    <li
                      key={domain.dominio}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2 text-foreground">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{domain.dominio}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {domain.cantidad} (
                        {domain.porcentaje.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por usuario o email..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="border-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Usuarios ({filteredUsers.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Gestiona los usuarios registrados, revisa su antiguedad y mantente al tanto de los dominios utilizados.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <Users className="h-12 w-12 text-muted-foreground/70" />
                <p>{searchTerm ? "No se encontraron usuarios con ese criterio" : "No hay usuarios registrados"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border/60 text-left text-sm font-semibold text-muted-foreground">
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Fecha creacion</th>
                      <th className="px-6 py-4">Antiguedad</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-sm font-semibold text-primary">
                                {user.usuario.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{user.usuario}</p>
                              {user.id === 1 && (
                                <div className="mt-0.5 flex items-center gap-1 text-xs text-primary">
                                  <Shield className="h-3 w-3" />
                                  Administrador
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{user.mail}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(user.fechaCreacion)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {formatAccountAge(user.fechaCreacion)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
                              onClick={() => alert("Edicion de usuarios en desarrollo")}
                              title="Editar usuario"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                              onClick={() => handleDeleteUser(user.id, user.usuario)}
                              disabled={user.id === 1}
                              title={user.id === 1 ? "No es posible eliminar al administrador" : "Eliminar usuario"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
