"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Store,
  MapPin,
  Phone,
  Package,
  Users,
  Plus,
  X,
  Pencil,
  Trash2,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import {
  getAllSucursales,
  createSucursal,
  updateSucursal,
  deleteSucursal,
  getUser,
  getSucursalesStats,
  type Sucursal,
  type SucursalFormData,
  type SucursalesStats,
  type BranchSummary
} from "@/lib/api"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"

interface BranchModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "add" | "edit"
  branchData: Sucursal | null
  onSave: (data: SucursalFormData) => Promise<void>
}

function BranchModal({ isOpen, onClose, mode, branchData, onSave }: BranchModalProps) {
  const [formData, setFormData] = useState<SucursalFormData>({
    nombre: "",
    ubicacion: "",
    telefono: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (mode === "edit" && branchData) {
      setFormData({
        nombre: branchData.nombre ?? "",
        ubicacion: branchData.ubicacion ?? "",
        telefono: branchData.telefono ?? ""
      })
    } else {
      setFormData({ nombre: "", ubicacion: "", telefono: "" })
    }
  }, [branchData, mode, isOpen])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.ubicacion.trim()) {
      alert("Por favor completa nombre y ubicacion")
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error("Error al guardar la sucursal:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === "add" ? "Nueva sucursal" : "Editar sucursal"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Nombre de la sucursal *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Sucursal Centro"
              disabled={isSubmitting}
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Ubicacion *
            </label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              placeholder="Direccion completa"
              disabled={isSubmitting}
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Telefono
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono ?? ""}
              onChange={handleChange}
              placeholder="Ej: 1143567890"
              disabled={isSubmitting}
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t bg-muted/30 p-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

const CHART_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#f97316",
  "#10b981",
  "#f43f5e",
  "#facc15",
  "#0ea5e9",
  "#94a3b8"
]
export default function BranchesPage() {
  const router = useRouter()
  const [branches, setBranches] = useState<Sucursal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [selectedBranch, setSelectedBranch] = useState<Sucursal | null>(null)
  const [stats, setStats] = useState<SucursalesStats | null>(null)

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.push("/login")
      return
    }

    void loadBranchesData()
  }, [router])

  const loadBranchesData = async () => {
    setIsLoading(true)
    setIsStatsLoading(true)
    setError("")

    try {
      const [branchesResponse, statsResponse] = await Promise.all([
        getAllSucursales(),
        getSucursalesStats()
      ])

      let errorMessage = ""

      if (branchesResponse.success && branchesResponse.data) {
        setBranches(branchesResponse.data)
      } else {
        setBranches([])
        errorMessage = branchesResponse.message || "Error al cargar sucursales"
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      } else {
        setStats(null)
        if (!errorMessage) {
          errorMessage = statsResponse.message || "Error al obtener indicadores"
        }
      }

      setError(errorMessage)
    } catch (err) {
      console.error("Error cargando sucursales:", err)
      setBranches([])
      setStats(null)
      setError("Error de conexion con el servidor")
    } finally {
      setIsLoading(false)
      setIsStatsLoading(false)
    }
  }

  const handleAddClick = () => {
    setModalMode("add")
    setSelectedBranch(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (branch: Sucursal) => {
    setModalMode("edit")
    setSelectedBranch(branch)
    setIsModalOpen(true)
  }

  const handleSave = async (formData: SucursalFormData) => {
    try {
      let response

      if (modalMode === "add") {
        response = await createSucursal(formData)
      } else if (selectedBranch) {
        response = await updateSucursal(selectedBranch.id, formData)
      }

      if (response && response.success) {
        alert(modalMode === "add" ? "Sucursal creada correctamente" : "Sucursal actualizada correctamente")
        await loadBranchesData()
      } else {
        alert("Error: " + (response?.message || "No fue posible completar la accion"))
      }
    } catch (error) {
      console.error("Error guardando sucursal:", error)
      alert("Error de conexion con el servidor")
    }
  }

  const handleDelete = async (branch: Sucursal) => {
    if (!confirm(`Estas seguro de eliminar la sucursal "${branch.nombre}"?`)) {
      return
    }

    try {
      const response = await deleteSucursal(branch.id)

      if (response.success) {
        alert("Sucursal eliminada correctamente")
        await loadBranchesData()
      } else {
        alert("Error: " + response.message)
      }
    } catch (error) {
      console.error("Error eliminando sucursal:", error)
      alert("Error de conexion con el servidor")
    }
  }

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)

  const formatNumber = (value: number): string =>
    new Intl.NumberFormat("es-AR").format(value)

  const formatPercentage = (value: number): string =>
    `${value.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`

  const promedioVentas = stats?.promedioVentasSucursal ?? 0

  const getSemaforo = (ventas: number) => {
    if (!stats || promedioVentas <= 0) {
      return { color: "bg-slate-400", label: "Sin datos" }
    }

    if (ventas >= promedioVentas * 1.25) {
      return { color: "bg-emerald-500", label: "Excelente" }
    }

    if (ventas >= promedioVentas * 0.85) {
      return { color: "bg-amber-400", label: "En linea" }
    }

    return { color: "bg-rose-500", label: "Bajo" }
  }

  const ventasPorSucursal = useMemo(() => stats?.ventasPorSucursal ?? [], [stats])

  const branchSummaryMap = useMemo(() => {
    const map = new Map<number, BranchSummary>()
    if (stats) {
      stats.ventasPorSucursal.forEach((item) => {
        map.set(item.id, item)
      })
    }
    return map
  }, [stats])

  const barData = useMemo(
    () =>
      ventasPorSucursal.map((item) => ({
        nombre: item.nombre,
        ventas: item.ventasTotales,
        numeroVentas: item.numeroVentas,
        numeroVendedores: item.numeroVendedores
      })),
    [ventasPorSucursal]
  )

  const pieData = useMemo(
    () =>
      ventasPorSucursal.map((item) => ({
        name: item.nombre,
        value: item.ventasTotales,
        percentage: item.porcentajeParticipacion
      })),
    [ventasPorSucursal]
  )

  const lineData = useMemo(
    () =>
      (stats?.ventasMensuales ?? []).map((item) => ({
        periodo: item.periodo,
        etiqueta: item.etiqueta,
        ventas: item.totalVentas,
        numeroVentas: item.numeroVentas
      })),
    [stats]
  )

  const mejorSucursal = stats?.mejorSucursal ?? null
  const sucursalEnRiesgo = stats?.sucursalConMenorVentas ?? null

  const isInitialLoading = isLoading && isStatsLoading && branches.length === 0 && !stats
  const renderBarTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null
    }
    const data = payload[0].payload
    return (
      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm">
        <p className="font-medium text-foreground">{data.nombre}</p>
        <p className="text-muted-foreground">Ventas: {formatCurrency(data.ventas)}</p>
        <p className="text-muted-foreground">Transacciones: {formatNumber(data.numeroVentas)}</p>
        <p className="text-muted-foreground">Vendedores: {formatNumber(data.numeroVendedores)}</p>
      </div>
    )
  }

  const renderPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null
    }
    const data = payload[0].payload
    return (
      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-muted-foreground">Ventas: {formatCurrency(data.value)}</p>
        <p className="text-muted-foreground">Participacion: {formatPercentage(data.percentage)}</p>
      </div>
    )
  }

  const renderLineTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null
    }
    const data = payload[0].payload
    return (
      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm">
        <p className="font-medium text-foreground">{data.etiqueta}</p>
        <p className="text-muted-foreground">Ventas: {formatCurrency(data.ventas)}</p>
        <p className="text-muted-foreground">Transacciones: {formatNumber(data.numeroVentas)}</p>
      </div>
    )
  }

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-3 text-muted-foreground">Cargando sucursales...</p>
        </div>
      </div>
    )
  }

  const totalSucursales = stats?.totalSucursales ?? 0
  const sucursalesActivas = stats?.sucursalesConVentas ?? 0
  const sucursalesInactivas = stats?.sucursalesSinVentas ?? 0
  const totalVendedores = stats?.totalVendedores ?? 0
  const totalStock = stats?.totalProductosEnStock ?? 0
  const ventasTotales = stats?.ventasTotales ?? 0
  const ventasUltimoMes = stats?.ventasUltimoMes ?? 0
  const ticketPromedio = stats?.ticketPromedioUltimoMes ?? 0
  const transaccionesUltimoMes = stats?.transaccionesUltimoMes ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif tracking-tight text-foreground">Gestion de sucursales</h1>
            <p className="mt-1 text-muted-foreground">
              Administra y monitorea el rendimiento de cada punto de venta
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al dashboard
              </Button>
            </Link>
            <Button onClick={handleAddClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva sucursal
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-serif text-foreground">Indicadores generales</h2>
            {isStatsLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>

          {stats ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">Total</span>
                    </div>
                    <div>
                      <p className="text-3xl font-light text-foreground">{formatNumber(totalSucursales)}</p>
                      <p className="text-xs text-muted-foreground">Sucursales registradas</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="text-xs text-muted-foreground">Activas</span>
                    </div>
                    <div>
                      <p className="text-3xl font-light text-foreground">{formatNumber(sucursalesActivas)}</p>
                      <p className="text-xs text-muted-foreground">
                        Inactivas: {formatNumber(sucursalesInactivas)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-xs text-muted-foreground">Personal</span>
                    </div>
                    <div>
                      <p className="text-3xl font-light text-foreground">{formatNumber(totalVendedores)}</p>
                      <p className="text-xs text-muted-foreground">Vendedores activos</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                        <Package className="h-5 w-5 text-amber-600" />
                      </div>
                      <span className="text-xs text-muted-foreground">Inventario</span>
                    </div>
                    <div>
                      <p className="text-3xl font-light text-foreground">{formatNumber(totalStock)}</p>
                      <p className="text-xs text-muted-foreground">Unidades en stock</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Ventas acumuladas</p>
                        <p className="text-2xl font-light text-foreground">{formatCurrency(ventasTotales)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Promedio por sucursal: {formatCurrency(promedioVentas)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Ultimos 30 dias</p>
                        <p className="text-2xl font-light text-foreground">{formatCurrency(ventasUltimoMes)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Transacciones registradas: {formatNumber(transaccionesUltimoMes)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <LineChartIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Ticket promedio</p>
                        <p className="text-2xl font-light text-foreground">{formatCurrency(ticketPromedio)}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                        <p className="text-xs uppercase text-muted-foreground">Mejor sucursal</p>
                        {mejorSucursal ? (
                          <div className="mt-1">
                            <p className="font-medium text-foreground">{mejorSucursal.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(mejorSucursal.ventasTotales)} • {formatPercentage(mejorSucursal.porcentajeParticipacion)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sin datos disponibles</p>
                        )}
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                        <p className="text-xs uppercase text-muted-foreground">En seguimiento</p>
                        {sucursalEnRiesgo ? (
                          <div className="mt-1">
                            <p className="font-medium text-foreground">{sucursalEnRiesgo.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(sucursalEnRiesgo.ventasTotales)} • {formatPercentage(sucursalEnRiesgo.porcentajeParticipacion)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sin datos disponibles</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : !isStatsLoading ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No se pudieron obtener los indicadores de las sucursales.
              </CardContent>
            </Card>
          ) : null}
        </section>
        {stats && (
          <section className="space-y-4">
            <h2 className="text-2xl font-serif text-foreground">Rendimiento por sucursal</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Ventas por sucursal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {barData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      No hay datos de ventas registrados.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="nombre"
                          height={80}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          angle={-35}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                        <Tooltip content={renderBarTooltip} cursor={{ fill: "#f1f5f9" }} />
                        <Bar dataKey="ventas" radius={[8, 8, 0, 0]}>
                          {barData.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingDown className="h-5 w-5 text-primary" />
                    Participacion de ventas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      No hay informacion disponible.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={4}
                          >
                            {pieData.map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={renderPieTooltip} />
                        </PieChart>
                      </ResponsiveContainer>
                      <ul className="flex-1 space-y-2">
                        {pieData.slice(0, 4).map((item, index) => (
                          <li
                            key={item.name}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2 text-foreground">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span>{item.name}</span>
                            </div>
                            <span className="text-muted-foreground">{formatPercentage(item.percentage)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LineChartIcon className="h-5 w-5 text-primary" />
                  Evolucion de ventas (ultimos 6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lineData.length === 0 ? (
                  <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                    No hay informacion historica disponible.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={lineData} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="etiqueta" tick={{ fill: "#6b7280", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                      <Tooltip content={renderLineTooltip} />
                      <Line type="monotone" dataKey="ventas" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Listado de sucursales ({branches.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {stats ? `Ventas acumuladas: ${formatCurrency(ventasTotales)}` : "Revisa y gestiona las sucursales registradas."}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Cargando sucursales...</p>
                </div>
              </div>
            ) : branches.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <Store className="h-12 w-12" />
                <p>No hay sucursales registradas.</p>
                <Button onClick={handleAddClick} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crear primera sucursal
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border/60 text-left text-sm font-semibold text-muted-foreground">
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Sucursal</th>
                      <th className="px-6 py-4">Ubicacion</th>
                      <th className="px-6 py-4">Contacto</th>
                      <th className="px-6 py-4">Vendedores</th>
                      <th className="px-6 py-4">Productos</th>
                      <th className="px-6 py-4">Ventas</th>
                      <th className="px-6 py-4">Participacion</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {branches.map((branch) => {
                      const resumen = branchSummaryMap.get(branch.id)
                      const ventasBranch = branch.ventasTotales ?? resumen?.ventasTotales ?? 0
                      const semaforo = getSemaforo(ventasBranch)

                      return (
                        <tr key={branch.id} className="transition-colors hover:bg-muted/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${semaforo.color}`} />
                              <span className="text-xs text-muted-foreground">{semaforo.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Store className="h-5 w-5 text-primary" />
                              </div>
                              <span className="text-sm font-medium text-foreground">{branch.nombre}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span className="max-w-xs truncate">{branch.ubicacion}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{branch.telefono ?? "N/D"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {formatNumber(branch.numeroVendedores ?? resumen?.numeroVendedores ?? 0)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {formatNumber(branch.numeroProductos ?? resumen?.numeroProductos ?? 0)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-semibold text-foreground">{formatCurrency(ventasBranch)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatNumber(resumen?.numeroVentas ?? 0)} transacciones
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {resumen ? formatPercentage(resumen.porcentajeParticipacion) : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleEditClick(branch)}
                                title="Editar sucursal"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 hover:bg-rose-50 hover:text-rose-600"
                                onClick={() => handleDelete(branch)}
                                title="Eliminar sucursal"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <BranchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          branchData={selectedBranch}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
