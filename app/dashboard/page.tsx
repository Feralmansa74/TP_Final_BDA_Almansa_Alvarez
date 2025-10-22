"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getUser,
  removeUser,
  getGeneralKPIs,
  getRankingSucursales,
  getVentasPorCategoria,
  getVendedoresBySucursal,
  type User,
  type DateRangeFilter
} from "@/lib/api"
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Loader2,
  LogOut,
  Package,
  ShoppingCart,
  Store,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react"
import { SalesLineChart } from "@/components/dashboard/SalesLineChart"
import { TopProductsChart } from "@/components/dashboard/TopProductsChart"
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart"
import { BranchComparisonChart } from "@/components/dashboard/BranchComparisonChart"

type PeriodKey = "30d" | "90d" | "ytd"

const PERIOD_LABELS: Record<PeriodKey, string> = {
  "30d": "Ultimos 30 dias",
  "90d": "Ultimos 90 dias",
  ytd: "Anio en curso"
}

interface PeriodMeta {
  range: DateRangeFilter
  label: string
  description: string
}

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

interface RankingSucursal {
  id: number
  nombre: string
  ubicacion: string
  ventasTotales: number
  numeroCompras: number
  ticketPromedio: number
  ranking: number
  porcentajeDelTotal: number
  estado: string
  color: string
}

interface CategoriaVenta {
  categoria: string
  numeroVentas: number
  unidadesVendidas: number
  ingresoTotal: number
}

interface VendedorSucursal {
  id: number
  nombre: string
  apellido: string
  dni: string
  numeroVentas: number
  ventasTotales: number
}
  interface responseType {
        success: boolean;
        message: string;
        data?: {
          id: number;
          nombre: string;
          ubicacion: string;
          ventasTotales: number;
          numeroCompras: number;
          ticketPromedio: number;
          ranking: number;
          porcentajeDelTotal: number;
          estado: string;
          color: string;
        }[] | undefined;
  }      

const formatDateParam = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })

const buildPeriodMeta = (period: PeriodKey): PeriodMeta => {
  const endDate = new Date()
  endDate.setHours(0, 0, 0, 0)

  const startDate = new Date(endDate)
  switch (period) {
    case "90d":
      startDate.setDate(startDate.getDate() - 89)
      break
    case "ytd":
      startDate.setMonth(0, 1)
      break
    default:
      startDate.setDate(startDate.getDate() - 29)
      break
  }

  return {
    range: {
      fechaInicio: formatDateParam(startDate),
      fechaFin: formatDateParam(endDate)
    },
    label: PERIOD_LABELS[period],
    description: `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [kpis, setKpis] = useState<GeneralKpis | null>(null)
  const [sucursales, setSucursales] = useState<RankingSucursal[]>([])
  const [categoriasDetalle, setCategoriasDetalle] = useState<CategoriaVenta[]>([])
  const [vendedores, setVendedores] = useState<VendedorSucursal[]>([])
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const [rankingPeriod, setRankingPeriod] = useState<PeriodKey>("30d")
  const [rankingMeta, setRankingMeta] = useState<PeriodMeta>(buildPeriodMeta("30d"))
  const [detailPeriod, setDetailPeriod] = useState<PeriodKey>("30d")
  const [detailMeta, setDetailMeta] = useState<PeriodMeta>(buildPeriodMeta("30d"))
  const [isLoading, setIsLoading] = useState(true)
  const [isRankingLoading, setIsRankingLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [error, setError] = useState("")
  const hasInitializedRanking = useRef(false)

  useEffect(() => {
    const loggedUser = getUser()
    if (!loggedUser) {
      router.push("/login")
      return
    }
    setUser(loggedUser)
  }, [router])

  const loadGeneralData = async () => {
    try {
      const response = await getGeneralKPIs()
      if (response.success && response.data) {
        setKpis(response.data)
      } else if (response.message) {
        setError(response.message)
      }
    } catch (err) {
      console.error("Error al cargar KPIs:", err)
      setError("No se pudieron obtener los indicadores generales.")
    }
  }

  const loadRankingData = async (range: DateRangeFilter) => {
    try {
      const response: responseType = await getRankingSucursales(range)
     
      if (response.success && response.data) {
        const data = response.data
        setSucursales(data)
        setSelectedSucursalId((prev) => {
          if (prev && data.some((item) => item.id === prev)) {
            return prev
          }
          return data.length > 0 ? data[0].id : null
        })
      } else {
        setSucursales([])
        if (response.message) {
          setError(response.message)
        }
      }
    } catch (err) {
      console.error("Error al cargar ranking de sucursales:", err)
      setError("No se pudo obtener el ranking de sucursales.")
      setSucursales([])
    }
  }

  const loadDetailData = async (sucursalId: number, range: DateRangeFilter) => {
    try {
      const [categoriasResponse, vendedoresResponse] = await Promise.all([
        getVentasPorCategoria({ sucursalId, ...range }),
        getVendedoresBySucursal(sucursalId, range)
      ])

      if (categoriasResponse.success && categoriasResponse.data) {
        setCategoriasDetalle(categoriasResponse.data)
      } else {
        setCategoriasDetalle([])
      }

      if (vendedoresResponse.success && vendedoresResponse.data) {
        setVendedores(vendedoresResponse.data)
      } else {
        setVendedores([])
      }
    } catch (err) {
      console.error("Error al cargar detalle de sucursal:", err)
      setError("No se pudo obtener el detalle de la sucursal seleccionada.")
      setCategoriasDetalle([])
      setVendedores([])
    }
  }

  useEffect(() => {
    if (!user) return

    const meta = buildPeriodMeta(rankingPeriod)
    setRankingMeta(meta)

    const fetchData = async () => {
      if (!hasInitializedRanking.current) {
        setError("")
        setIsLoading(true)
        try {
          await Promise.all([loadGeneralData(), loadRankingData(meta.range)])
          hasInitializedRanking.current = true
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsRankingLoading(true)
        try {
          await loadRankingData(meta.range)
        } finally {
          setIsRankingLoading(false)
        }
      }
    }

    fetchData()
  }, [user, rankingPeriod])

  useEffect(() => {
    if (!user || selectedSucursalId === null) return

    const meta = buildPeriodMeta(detailPeriod)
    setDetailMeta(meta)

    setIsDetailLoading(true)
    loadDetailData(selectedSucursalId, meta.range).finally(() => {
      setIsDetailLoading(false)
    })
  }, [user, selectedSucursalId, detailPeriod])

  const handleLogout = () => {
    removeUser()
    router.push("/login")
  }

  const periodEntries = Object.entries(PERIOD_LABELS) as Array<[PeriodKey, string]>

  const selectedSucursal = useMemo(
    () => sucursales.find((item) => item.id === selectedSucursalId) || null,
    [sucursales, selectedSucursalId]
  )

  const comparativaValue = kpis?.comparativa ?? 0
  const comparativaIsPositive = comparativaValue >= 0
  const promedioMensualEstimado = kpis ? kpis.promedioMensual * 30 : 0

  const semaforoColors: Record<string, string> = {
    verde: "bg-green-500",
    amarillo: "bg-yellow-500",
    rojo: "bg-red-500"
  }

  if (!user || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif tracking-tight text-foreground">
              Dashboard de ventas
            </h1>
            <p className="mt-1 text-muted-foreground">
              Bienvenido, <strong>{user.usuario}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard/users">
              <Button variant="outline">Gestion de usuarios</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </Button>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-serif text-foreground">Nivel 1 - Vision general</h2>
              <p className="text-sm text-muted-foreground">
                Resumen de ventas acumuladas y dinamica reciente de la empresa.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Total acumulado</span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-foreground">
                  {kpis ? formatCurrency(kpis.ventasTotales) : "-"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {kpis?.totalTransacciones || 0} transacciones registradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Promedio proyectado mensual
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-foreground">
                  {kpis ? formatCurrency(promedioMensualEstimado) : "-"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Estimado segun el desempeno de los ultimos 30 dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-lg p-3 ${
                      comparativaIsPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {comparativaIsPositive ? (
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Comparativa mensual</span>
                </div>
                <p
                  className={`mt-4 text-3xl font-semibold ${
                    comparativaIsPositive ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {`${comparativaValue > 0 ? "+" : ""}${comparativaValue.toFixed(1)}%`}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {kpis
                    ? `Actual: ${formatCurrency(kpis.ventasMesActual)} - Anterior: ${formatCurrency(
                        kpis.ventasMesAnterior
                      )}`
                    : "Sin datos"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-purple-500/10 p-3">
                    <Store className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Cobertura actual</span>
                </div>
                <div className="mt-4 space-y-1 text-sm text-foreground">
                  <p>
                    {kpis?.totalSucursales || 0} sucursales - {kpis?.totalProductos || 0} productos
                  </p>
                  <p>{kpis?.totalTransacciones || 0} operaciones historicas</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SalesLineChart />
            <TopProductsChart />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-serif text-foreground">Nivel 2 - Sucursales</h2>
              <p className="text-sm text-muted-foreground">
                Ranking y comparacion de desempeno por sucursal en el periodo seleccionado.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="rankingPeriod" className="text-sm text-muted-foreground">
                Periodo
              </label>
              <select
                id="rankingPeriod"
                value={rankingPeriod}
                onChange={(event) => setRankingPeriod(event.target.value as PeriodKey)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {periodEntries.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <BranchComparisonChart
                data={sucursales}
                isLoading={isRankingLoading || isLoading}
                periodLabel={rankingMeta.label}
                periodDescription={rankingMeta.description}
              />
            </div>
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Ranking de sucursales
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click para ver el detalle de la sucursal
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {isRankingLoading && !isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : sucursales.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No hay datos de ventas para el periodo seleccionado.
                  </p>
                ) : (
                  sucursales.map((sucursal) => (
                    <button
                      type="button"
                      key={sucursal.id}
                      onClick={() => setSelectedSucursalId(sucursal.id)}
                      className={`w-full rounded-lg border p-4 text-left transition-colors ${
                        selectedSucursalId === sucursal.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">
                              #{sucursal.ranking.toString().padStart(2, "0")}
                            </span>
                            <p className="text-sm font-medium text-foreground">
                              {sucursal.nombre}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{sucursal.ubicacion}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(sucursal.ventasTotales)}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                semaforoColors[sucursal.color] || "bg-slate-400"
                              }`}
                            />
                            <span>{sucursal.estado}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-serif text-foreground">Nivel 3 - Detalle</h2>
              <p className="text-sm text-muted-foreground">
                Analisis de ventas por categoria y por vendedor en una sucursal especifica.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="branchSelect" className="text-xs text-muted-foreground">
                  Sucursal
                </label>
                <select
                  id="branchSelect"
                  value={selectedSucursalId ?? ""}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    if (!Number.isNaN(value)) {
                      setSelectedSucursalId(value)
                    }
                  }}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sucursales.length === 0 ? (
                    <option value="" disabled>
                      Sin sucursales disponibles
                    </option>
                  ) : (
                    sucursales.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="detailPeriod" className="text-xs text-muted-foreground">
                  Periodo
                </label>
                <select
                  id="detailPeriod"
                  value={detailPeriod}
                  onChange={(event) => setDetailPeriod(event.target.value as PeriodKey)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {periodEntries.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedSucursalId === null ? (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Selecciona una sucursal para ver el detalle de categorias y vendedores.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <CategoryPieChart data={categoriasDetalle} isLoading={isDetailLoading} />
              </div>
              <Card className="border-border/50 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Ventas por vendedor
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {detailMeta.label}
                    </span>
                  </CardTitle>
                  {selectedSucursal && (
                    <p className="text-sm text-muted-foreground">
                    {selectedSucursal.nombre} - {detailMeta.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {isDetailLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : vendedores.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No hay ventas registradas para este periodo.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {vendedores.map((vendedor) => (
                        <div
                          key={vendedor.id}
                          className="rounded-lg border border-border bg-card/60 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {vendedor.nombre} {vendedor.apellido}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {vendedor.numeroVentas} ventas
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {formatCurrency(vendedor.ventasTotales)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Accesos rapidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                <Link href="/dashboard/users">
                  <Button
                    variant="outline"
                    className="flex h-20 w-full flex-col items-center justify-center gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Package className="h-6 w-6" />
                    <span className="text-sm font-medium">Gestion de usuarios</span>
                  </Button>
                </Link>
                <Link href="/dashboard/branches">
                  <Button
                    variant="outline"
                    className="flex h-20 w-full flex-col items-center justify-center gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Store className="h-6 w-6" />
                    <span className="text-sm font-medium">Sucursales</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="flex h-20 w-full flex-col items-center justify-center gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                  onClick={() => alert("Funcionalidad en desarrollo")}
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span className="text-sm font-medium">Productos</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex h-20 w-full flex-col items-center justify-center gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                  onClick={() => alert("Funcionalidad en desarrollo")}
                >
                  <Package className="h-6 w-6" />
                  <span className="text-sm font-medium">Reportes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
