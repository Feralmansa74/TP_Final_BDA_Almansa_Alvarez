"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  getRankingSucursales,
  getVendedoresBySucursal,
  getVendedorDetalle,
  type DateRangeFilter,
  type VendedorDetalle
} from "@/lib/api"
import {
  AlertCircle,
  ArrowLeft,
  Crown,
  Loader2,
  Package,
  Search,
  Shield,
  Sparkles,
  Store,
  TrendingUp,
  Trophy,
  Users
} from "lucide-react"

type PeriodKey = "30d" | "90d" | "ytd"

const PERIOD_LABELS: Record<PeriodKey, string> = {
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  ytd: "Año en curso"
}

const buildPeriodMeta = (key: PeriodKey): { range: DateRangeFilter; description: string } => {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)

  if (key === "90d") {
    start.setDate(start.getDate() - 89)
  } else if (key === "ytd") {
    start.setMonth(0, 1)
  } else {
    start.setDate(start.getDate() - 29)
  }

  return {
    range: {
      fechaInicio: start.toISOString().split("T")[0],
      fechaFin: end.toISOString().split("T")[0]
    },
    description: `${start.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}`
  }
}

interface BranchSummary {
  id: number
  nombre: string
}

interface WorkerSummary {
  id: number
  nombre: string
  apellido: string
  dni: string
  numeroVentas: number
  ventasTotales: number
  sucursalId: number
  sucursalNombre: string
}

type PerformanceLevel = "Bajo" | "En progreso" | "Bien" | "Excelente"

const getPerformanceLevel = (ventas: number): PerformanceLevel => {
  if (ventas === 0) return "Bajo"
  if (ventas > 10) return "Excelente"
  if (ventas > 5) return "Bien"
  return "En progreso"
}

const performanceStyles: Record<PerformanceLevel, string> = {
  Bajo: "bg-red-50 text-red-600 border-red-200",
  "En progreso": "bg-yellow-50 text-yellow-700 border-yellow-200",
  Bien: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Excelente: "bg-violet-50 text-violet-700 border-violet-200"
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

const formatNumber = (value: number) =>
  value.toLocaleString("es-AR", {
    maximumFractionDigits: 0
  })

export default function WorkforcePage() {
  const [period, setPeriod] = useState<PeriodKey>("30d")
  const [{ range, description }, setMeta] = useState(buildPeriodMeta("30d"))
  const [workers, setWorkers] = useState<WorkerSummary[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerSummary[]>([])
  const [branches, setBranches] = useState<BranchSummary[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null)
  const [workerDetail, setWorkerDetail] = useState<VendedorDetalle | null>(null)
  const [detailError, setDetailError] = useState("")
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const meta = buildPeriodMeta(period)
    setMeta(meta)
    void loadWorkforce(meta.range)
  }, [period])

  useEffect(() => {
    if (!search.trim()) {
      setFilteredWorkers(workers)
      return
    }
    const normalized = search.toLowerCase()
    setFilteredWorkers(
      workers.filter(
        (worker) =>
          worker.nombre.toLowerCase().includes(normalized) ||
          worker.apellido.toLowerCase().includes(normalized) ||
          worker.sucursalNombre.toLowerCase().includes(normalized)
      )
    )
  }, [search, workers])

  const loadWorkforce = async (dateRange: DateRangeFilter) => {
    setIsLoading(true)
    setError("")
    setSelectedWorkerId(null)
    setWorkerDetail(null)

    try {
      const rankingResponse = await getRankingSucursales(dateRange)
      const branchList: BranchSummary[] =
        rankingResponse.success && rankingResponse.data
          ? rankingResponse.data.map((branch) => ({
              id: branch.id,
              nombre: branch.nombre
            }))
          : []

      setBranches(branchList)

      const vendorPromises = branchList.map(async (branch) => {
        const response = await getVendedoresBySucursal(branch.id, dateRange)
        if (!response.success || !response.data) {
          return []
        }
        return response.data.map((vendor) => ({
          id: vendor.id,
          nombre: vendor.nombre,
          apellido: vendor.apellido,
          dni: vendor.dni,
          numeroVentas: vendor.numeroVentas,
          ventasTotales: vendor.ventasTotales,
          sucursalId: branch.id,
          sucursalNombre: branch.nombre
        }))
      })

      const resolved = await Promise.all(vendorPromises)
      const flattened = resolved.flat().sort((a, b) => b.ventasTotales - a.ventasTotales)
      setWorkers(flattened)
      setFilteredWorkers(flattened)
    } catch (err) {
      console.error("Error al cargar trabajadores:", err)
      setError("No pudimos obtener el rendimiento de los trabajadores.")
      setWorkers([])
      setFilteredWorkers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectWorker = async (worker: WorkerSummary) => {
    setSelectedWorkerId(worker.id)
    setDetailLoading(true)
    setDetailError("")
    try {
      const response = await getVendedorDetalle(worker.id, range)
      if (response.success && response.data) {
        setWorkerDetail(response.data)
      } else {
        setDetailError(response.message || "No pudimos obtener el detalle de este vendedor.")
        setWorkerDetail(null)
      }
    } catch (err) {
      console.error("Error al cargar detalle del vendedor:", err)
      setDetailError("Ocurrió un error al obtener el detalle del vendedor.")
      setWorkerDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const overview = useMemo(() => {
    if (workers.length === 0) {
      return {
        totalWorkers: 0,
        totalSales: 0,
        zeroSales: 0,
        topPerformer: null as WorkerSummary | null
      }
    }
    const zeroSales = workers.filter((worker) => worker.numeroVentas === 0).length
    const totalSales = workers.reduce((sum, worker) => sum + worker.ventasTotales, 0)
    return {
      totalWorkers: workers.length,
      totalSales,
      zeroSales,
      topPerformer: workers[0]
    }
  }, [workers])

  const statusDistribution = useMemo(() => {
    const buckets: Record<PerformanceLevel, number> = {
      Bajo: 0,
      "En progreso": 0,
      Bien: 0,
      Excelente: 0
    }
    workers.forEach((worker) => {
      buckets[getPerformanceLevel(worker.numeroVentas)]++
    })
    return buckets
  }, [workers])

  const topWorkers = useMemo(
    () => workers.slice(0, 5),
    [workers]
  )

  const branchLeaders = useMemo(() => {
    const map = new Map<number, WorkerSummary>()
    workers.forEach((worker) => {
      const current = map.get(worker.sucursalId)
      if (!current || worker.ventasTotales > current.ventasTotales) {
        map.set(worker.sucursalId, worker)
      }
    })
    return branches
      .map((branch) => ({
        branch,
        leader: map.get(branch.id) || null
      }))
      .filter((item) => item.leader)
  }, [branches, workers])

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-6 space-y-8">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al dashboard
          </Link>
          <span>/</span>
          <span>Fuerza comercial</span>
        </div>

        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Gestión de talento comercial
          </p>
          <h1 className="mt-2 text-4xl font-serif text-foreground">Rendimiento de trabajadores</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Analiza a cada vendedor por sucursal, identifica a los mejores performers y detecta
            oportunidades de acompañamiento según su nivel de actividad.
          </p>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trabajadores activos</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">
                {overview.totalWorkers}
              </p>
              <p className="text-xs text-muted-foreground">En el periodo {PERIOD_LABELS[period]}</p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ventas del equipo</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">
                {formatCurrency(overview.totalSales)}
              </p>
              <p className="text-xs text-muted-foreground">Monto acumulado por vendedores</p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sin ventas registradas</CardTitle>
              <Shield className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">
                {overview.zeroSales}
              </p>
              <p className="text-xs text-muted-foreground">Necesitan acompañamiento</p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mejor vendedor</CardTitle>
              <Crown className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {overview.topPerformer ? (
                <>
                  <p className="text-lg font-semibold text-foreground">
                    {overview.topPerformer.nombre} {overview.topPerformer.apellido}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(overview.topPerformer.ventasTotales)} · {overview.topPerformer.sucursalNombre}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-5 w-5 text-primary" />
                  Top vendedores
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ranking general según ventas del periodo.
                </p>
              </div>
              <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                {description}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              {topWorkers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin ventas registradas.</p>
              ) : (
                topWorkers.map((worker, index) => (
                  <div
                    key={worker.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-card/70 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-muted-foreground">
                        #{(index + 1).toString().padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {worker.nombre} {worker.apellido}
                        </p>
                        <p className="text-xs text-muted-foreground">{worker.sucursalNombre}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(worker.ventasTotales)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {worker.numeroVentas} ventas
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="h-5 w-5 text-primary" />
                Líderes por sucursal
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Primer lugar dentro de cada sucursal con ventas registradas.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {branchLeaders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay ventas registradas por sucursal.</p>
              ) : (
                branchLeaders.map(({ branch, leader }) => (
                  <div
                    key={branch.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{branch.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {leader?.nombre} {leader?.apellido}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {leader ? formatCurrency(leader.ventasTotales) : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">{leader?.numeroVentas ?? 0} ventas</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/70 shadow-sm lg:col-span-2">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">Listado de trabajadores</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Busca por nombre o filtra según el periodo seleccionado para analizar su desempeño.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-full border border-border/70 bg-white px-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre o sucursal..."
                    className="border-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as PeriodKey)}
                  className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm text-foreground"
                >
                  {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredWorkers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No encontramos trabajadores con esos criterios.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/40">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3">Trabajador</th>
                        <th className="px-4 py-3">Sucursal</th>
                        <th className="px-4 py-3">Ventas</th>
                        <th className="px-4 py-3">Monto</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.map((worker) => {
                        const status = getPerformanceLevel(worker.numeroVentas)
                        return (
                          <tr
                            key={`${worker.id}-${worker.sucursalId}`}
                            className="border-b border-border/50 text-sm"
                          >
                            <td className="px-4 py-3 font-medium text-foreground">
                              {worker.nombre} {worker.apellido}
                              <p className="text-xs text-muted-foreground">{worker.dni}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {worker.sucursalNombre}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {worker.numeroVentas}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {formatCurrency(worker.ventasTotales)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${performanceStyles[status]}`}
                              >
                                <Sparkles className="h-3 w-3" />
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant={selectedWorkerId === worker.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSelectWorker(worker)}
                              >
                                Ver KPIs
                              </Button>
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

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-primary" />
                Detalle del trabajador
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona un colaborador para ver sus indicadores y mix de productos.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : detailError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {detailError}
                </div>
              ) : workerDetail ? (
                <>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {workerDetail.vendedor.nombre} {workerDetail.vendedor.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {workerDetail.vendedor.sucursalNombre} · DNI {workerDetail.vendedor.dni}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Ventas del periodo</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(workerDetail.stats.ventasTotales)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Ticket promedio</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(workerDetail.stats.ticketPromedio)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Participación </p>
                      <p className="text-lg font-semibold text-foreground">
                        {workerDetail.stats.participacionSucursal.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Unidades vendidas</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatNumber(workerDetail.stats.unidadesVendidas)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Últimas actividades
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Primera venta: {workerDetail.stats.primeraVenta || "Sin registro"}</p>
                      <p>Última venta: {workerDetail.stats.ultimaVenta || "Sin registro"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Productos más vendidos
                    </p>
                    <div className="mt-2 space-y-2">
                      {workerDetail.productos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Aún no registra ventas en este periodo.
                        </p>
                      ) : (
                        workerDetail.productos.slice(0, 5).map((producto) => (
                          <div
                            key={producto.id}
                            className="rounded-lg border border-border/60 p-3"
                          >
                            <p className="text-sm font-semibold text-foreground">{producto.nombre}</p>
                            <p className="text-xs text-muted-foreground">{producto.categoria}</p>
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{producto.unidadesVendidas} unidades</span>
                              <span>{formatCurrency(producto.ingresoTotal)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecciona un trabajador para visualizar sus métricas.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                Estado del equipo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Clasificación según la cantidad de ventas individuales.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.keys(statusDistribution) as PerformanceLevel[]).map((status) => (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${performanceStyles[status]}`}>
                      {status}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {statusDistribution[status]} colaboradores
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
