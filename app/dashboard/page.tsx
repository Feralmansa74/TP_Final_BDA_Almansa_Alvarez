"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  getVendedorDetalle,
  type User,
  type DateRangeFilter,
  type VendedorDetalle
} from "@/lib/api"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  Loader2,
  LogOut,
  Package,
  ShoppingCart,
  ShoppingBag,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
  X
} from "lucide-react"
import { SalesLineChart } from "@/components/dashboard/SalesLineChart"
import { TopProductsChart } from "@/components/dashboard/TopProductsChart"
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart"
import { BranchComparisonChart } from "@/components/dashboard/BranchComparisonChart"
import {
  ResponsiveContainer as RechartsResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsCartesianGrid,
  Tooltip as RechartsTooltip
} from "recharts"

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

type VendedorDetalleProducto = VendedorDetalle["productos"][number]
interface responseType {
  success: boolean
  message: string
  data?:
    | {
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
      }[]
    | undefined
}

interface BranchDetailModalProps {
  open: boolean
  onClose: () => void
  sucursal: RankingSucursal | null
  vendedores: VendedorSucursal[]
  categorias: CategoriaVenta[]
  isLoading: boolean
  periodOptions: Array<[PeriodKey, string]>
  detailPeriod: PeriodKey
  onPeriodChange: (period: PeriodKey) => void
  detailMeta: PeriodMeta
  dateRange: DateRangeFilter
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
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

  const handleSucursalDrilldown = (sucursalId: number) => {
    if (selectedSucursalId !== sucursalId) {
      setSelectedSucursalId(sucursalId)
    }
    setIsDetailModalOpen(true)
  }

  const closeDetailModal = () => {
    setIsDetailModalOpen(false)
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

          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)]">
            <BranchComparisonChart
              data={sucursales}
              isLoading={isRankingLoading || isLoading}
              periodLabel={rankingMeta.label}
              periodDescription={rankingMeta.description}
              onSelectBranch={handleSucursalDrilldown}
            />
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
                      onClick={() => handleSucursalDrilldown(sucursal.id)}
                      className={`w-full rounded-lg border p-4 text-left transition-colors ${
                        selectedSucursalId === sucursal.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                      aria-label={`Ver KPIs de ${sucursal.nombre}`}
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

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Accesos rapidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
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
                <Link href="/dashboard/products">
                  <Button
                    variant="outline"
                    className="flex h-20 w-full flex-col items-center justify-center gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    <span className="text-sm font-medium">Productos</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <BranchDetailModal
          open={isDetailModalOpen && !!selectedSucursal}
          onClose={closeDetailModal}
          sucursal={selectedSucursal}
          vendedores={vendedores}
          categorias={categoriasDetalle}
          isLoading={isDetailLoading}
          periodOptions={periodEntries}
          detailPeriod={detailPeriod}
          onPeriodChange={setDetailPeriod}
          detailMeta={detailMeta}
          dateRange={detailMeta.range}
        />
      </div>
    </div>
  )
}

function BranchDetailModal({
  open,
  onClose,
  sucursal,
  vendedores,
  categorias,
  isLoading,
  periodOptions,
  detailPeriod,
  onPeriodChange,
  detailMeta,
  dateRange
}: BranchDetailModalProps) {
  const [viewMode, setViewMode] = useState<"branch" | "vendor" | "product">("branch")
  const [activeVendorId, setActiveVendorId] = useState<number | null>(null)
  const [activeProductId, setActiveProductId] = useState<number | null>(null)
  const [vendorDetail, setVendorDetail] = useState<VendedorDetalle | null>(null)
  const [vendorLoading, setVendorLoading] = useState(false)
  const [vendorError, setVendorError] = useState("")
  const rangeSignature = `${dateRange.fechaInicio ?? ""}-${dateRange.fechaFin ?? ""}`

  const formatDate = (value: string | null | undefined) =>
    value
      ? new Date(value).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      : "Sin registro"

  const fetchVendorDetail = useCallback(
    async (vendorId: number, options?: { keepView?: boolean }) => {
      setVendorLoading(true)
      setVendorError("")
      try {
        const response = await getVendedorDetalle(vendorId, dateRange)
        if (response.success && response.data) {
          setVendorDetail(response.data)
          setActiveVendorId(vendorId)

          if (!options?.keepView) {
            setViewMode("vendor")
            setActiveProductId(null)
          } else if (viewMode === "product") {
            const exists = response.data.productos.some((item) => item.id === activeProductId)
            if (!exists) {
              setActiveProductId(response.data.productos[0]?.id ?? null)
            }
          }
        } else {
          setVendorError(response.message || "No se pudo cargar el detalle del vendedor.")
        }
      } catch (error) {
        console.error("Error al obtener detalle del vendedor:", error)
        setVendorError("No se pudo cargar el detalle del vendedor.")
      } finally {
        setVendorLoading(false)
      }
    },
    [activeProductId, dateRange, viewMode]
  )

  useEffect(() => {
    if (!open) {
      setViewMode("branch")
      setActiveVendorId(null)
      setActiveProductId(null)
      setVendorDetail(null)
      setVendorError("")
      return
    }
  }, [open])

  useEffect(() => {
    if (!open || !activeVendorId) {
      return
    }
    fetchVendorDetail(activeVendorId, { keepView: true })
  }, [open, activeVendorId, fetchVendorDetail, rangeSignature])

  useEffect(() => {
    if (!open) {
      return
    }
    setViewMode("branch")
    setActiveVendorId(null)
    setActiveProductId(null)
  }, [open, sucursal?.id])

  if (!open || !sucursal) {
    return null
  }

  const branchKpis = [
    {
      label: "Ventas del periodo",
      value: formatCurrency(sucursal.ventasTotales)
    },
    {
      label: "Ticket promedio",
      value: formatCurrency(sucursal.ticketPromedio)
    },
    {
      label: "Operaciones",
      value: `${sucursal.numeroCompras.toLocaleString("es-AR")} compras`
    },
    {
      label: "Cuota del total",
      value: `${sucursal.porcentajeDelTotal.toFixed(1)}%`
    }
  ]

  const vendedoresOrdenados = [...vendedores].sort(
    (a, b) => b.ventasTotales - a.ventasTotales
  )
  const totalVentasEquipo = vendedoresOrdenados.reduce(
    (acc, vendedor) => acc + vendedor.ventasTotales,
    0
  )
  const totalOperacionesEquipo = vendedoresOrdenados.reduce(
    (acc, vendedor) => acc + vendedor.numeroVentas,
    0
  )
  const promedioTicketEquipo =
    totalOperacionesEquipo > 0 ? totalVentasEquipo / totalOperacionesEquipo : 0
  const mejorVendedor = vendedoresOrdenados[0] ?? null
  const maxVentaVendedor = vendedoresOrdenados.reduce(
    (max, vendedor) => Math.max(max, vendedor.ventasTotales),
    0
  )

  const vendedoresChartData = vendedoresOrdenados.map((vendedor) => ({
    id: vendedor.id,
    nombre: `${vendedor.nombre} ${vendedor.apellido}`,
    ventas: vendedor.ventasTotales
  }))

  const vendorProducts = vendorDetail?.productos ?? []
  const activeProduct =
    vendorProducts.find((item) => item.id === activeProductId) || vendorProducts[0] || null

  const handleVendorSelect = (vendorId: number) => {
    fetchVendorDetail(vendorId)
  }

  const handleProductSelect = (productId: number) => {
    setActiveProductId(productId)
    setViewMode("product")
  }

  const handleBackNavigation = () => {
    if (viewMode === "product") {
      setViewMode("vendor")
      setActiveProductId(null)
      return
    }

    if (viewMode === "vendor") {
      setViewMode("branch")
      setActiveVendorId(null)
      setActiveProductId(null)
    }
  }

  const viewHeader =
    viewMode === "branch"
      ? "Nivel 2 - Sucursal"
      : viewMode === "vendor"
        ? "Nivel 3 - Equipo"
        : "Nivel 4 - Producto"

  const viewTitle =
    viewMode === "branch"
      ? sucursal.nombre
      : viewMode === "vendor"
        ? vendorDetail
          ? `${vendorDetail.vendedor.nombre} ${vendorDetail.vendedor.apellido}`
          : "Vendedor"
        : activeProduct?.nombre ?? "Producto"

  const viewSubtitle =
    viewMode === "branch"
      ? sucursal.ubicacion
      : viewMode === "vendor"
        ? vendorDetail?.vendedor.dni
        : activeProduct?.categoria

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-10">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-6xl rounded-3xl border border-border/60 bg-background/95 p-8 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {viewMode !== "branch" && (
              <button
                type="button"
                onClick={handleBackNavigation}
                className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground"
                aria-label={viewMode === "product" ? "Volver al vendedor" : "Volver a la sucursal"}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {viewHeader}
              </p>
              <h3 className="text-3xl font-serif text-foreground">{viewTitle}</h3>
              <p className="text-sm text-muted-foreground">{viewSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">{detailMeta.label}</p>
              <p>{detailMeta.description}</p>
            </div>
            <select
              value={detailPeriod}
              onChange={(event) => onPeriodChange(event.target.value as PeriodKey)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {periodOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground"
              aria-label="Cerrar detalle de sucursal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {viewMode === "branch" && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {branchKpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm"
                >
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <CategoryPieChart data={categorias} isLoading={isLoading} />
              </div>
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Rendimiento de vendedores
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {vendedoresOrdenados.length} colaboradores
                    </span>
                  </CardTitle>
                  <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
                    <div>
                      <p>Ventas del equipo</p>
                      <p className="text-base font-semibold text-foreground">
                        {formatCurrency(totalVentasEquipo)}
                      </p>
                    </div>
                    <div>
                      <p>Ticket promedio</p>
                      <p className="text-base font-semibold text-foreground">
                        {formatCurrency(promedioTicketEquipo)}
                      </p>
                    </div>
                    <div>
                      <p>Mejor vendedor</p>
                      <p className="text-base font-semibold text-foreground">
                        {mejorVendedor
                          ? `${mejorVendedor.nombre} ${mejorVendedor.apellido}`
                          : "Sin datos"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : vendedoresOrdenados.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No hay ventas registradas para este periodo en la sucursal.
                    </p>
                  ) : (
                    <>
                      <div className="h-[260px]">
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            data={vendedoresChartData}
                            margin={{ left: 0, right: 10 }}
                          >
                            <RechartsCartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <RechartsXAxis
                              dataKey="nombre"
                              tick={{ fontSize: 12, fill: "#6b7280" }}
                              interval={0}
                              angle={-20}
                              textAnchor="end"
                              height={60}
                            />
                            <RechartsYAxis
                              tick={{ fontSize: 12, fill: "#6b7280" }}
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <RechartsTooltip
                              cursor={{ fill: "rgba(15, 23, 42, 0.06)" }}
                              formatter={(value: number) => formatCurrency(value)}
                            />
                            <RechartsBar
                              dataKey="ventas"
                              radius={[8, 8, 0, 0]}
                              fill="hsl(var(--primary))"
                            />
                          </RechartsBarChart>
                        </RechartsResponsiveContainer>
                      </div>
                      <div className="mt-6 space-y-3">
                        {vendedoresOrdenados.map((vendedor) => {
                          const progreso =
                            maxVentaVendedor > 0
                              ? Math.round((vendedor.ventasTotales / maxVentaVendedor) * 100)
                              : 0
                          const ticketVendedor =
                            vendedor.numeroVentas > 0
                              ? vendedor.ventasTotales / vendedor.numeroVentas
                              : 0
                          const isActive = activeVendorId === vendedor.id && viewMode !== "branch"

                          return (
                            <button
                              key={vendedor.id}
                              type="button"
                              onClick={() => handleVendorSelect(vendedor.id)}
                              className={`w-full rounded-xl border p-3 text-left transition ${
                                isActive
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/40 hover:bg-muted/40"
                              }`}
                              aria-label={`Ver KPIs de ${vendedor.nombre} ${vendedor.apellido}`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {vendedor.nombre} {vendedor.apellido}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {vendedor.numeroVentas} ventas · Ticket{" "}
                                    {formatCurrency(ticketVendedor)}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                  {formatCurrency(vendedor.ventasTotales)}
                                </p>
                              </div>
                              <div className="mt-3 h-1.5 rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${progreso}%` }}
                                />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {viewMode === "vendor" && (
          <div className="mt-6 space-y-6">
            {vendorLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : vendorError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {vendorError}
              </div>
            ) : vendorDetail ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: "Ventas del vendedor",
                      value: formatCurrency(vendorDetail.stats.ventasTotales)
                    },
                    {
                      label: "Ticket promedio",
                      value: formatCurrency(vendorDetail.stats.ticketPromedio)
                    },
                    {
                      label: "Participación",
                      value: `${vendorDetail.stats.participacionSucursal.toFixed(1)}%`
                    },
                    {
                      label: "Unidades vendidas",
                      value: vendorDetail.stats.unidadesVendidas.toLocaleString("es-AR")
                    }
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm"
                    >
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className="mt-2 text-xl font-semibold text-foreground">{kpi.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="border-border/60 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          Línea de tiempo
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {vendorDetail.stats.numeroVentas} transacciones
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Primera venta</span>
                        <span className="font-semibold text-foreground">
                          {formatDate(vendorDetail.stats.primeraVenta)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Última venta</span>
                        <span className="font-semibold text-foreground">
                          {formatDate(vendorDetail.stats.ultimaVenta)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Productos vendidos</span>
                        <span className="font-semibold text-foreground">
                          {vendorDetail.stats.productosVendidos}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 shadow-sm">
                    <CardHeader>
                      <CardTitle>Top productos del vendedor</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                      {vendorProducts.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          Todavía no hay productos vendidos en este periodo.
                        </p>
                      ) : (
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            data={vendorProducts.slice(0, 6).map((item) => ({
                              ...item,
                              ingreso: item.ingresoTotal
                            }))}
                            margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                          >
                            <RechartsCartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <RechartsXAxis
                              dataKey="nombre"
                              tick={{ fontSize: 11, fill: "#6b7280" }}
                              interval={0}
                              angle={-20}
                              height={60}
                            />
                            <RechartsYAxis
                              tick={{ fontSize: 12, fill: "#6b7280" }}
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <RechartsTooltip
                              formatter={(value: number) => formatCurrency(value)}
                              cursor={{ fill: "rgba(15,23,42,0.05)" }}
                            />
                            <RechartsBar dataKey="ingreso" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                          </RechartsBarChart>
                        </RechartsResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Productos vendidos</span>
                      <span className="text-xs text-muted-foreground">
                        Selecciona un producto para ver el detalle
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vendorProducts.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        El vendedor aún no registró ventas en este periodo.
                      </p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {vendorProducts.map((producto) => (
                          <button
                            key={producto.id}
                            type="button"
                            onClick={() => handleProductSelect(producto.id)}
                            className="rounded-xl border border-border/60 p-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{producto.nombre}</p>
                                <p className="text-xs text-muted-foreground">{producto.categoria}</p>
                              </div>
                              <p className="text-sm font-semibold text-foreground">
                                {formatCurrency(producto.ingresoTotal)}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{producto.unidadesVendidas} unidades</span>
                              <span>{producto.numeroTransacciones} transacciones</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-sm text-muted-foreground">
                Selecciona un vendedor para ver su desempeño detallado.
              </div>
            )}
          </div>
        )}

        {viewMode === "product" && (
          <div className="mt-6 space-y-6">
            {vendorLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !vendorDetail || !activeProduct ? (
              <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-sm text-muted-foreground">
                Selecciona un producto del listado del vendedor para ver sus métricas.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="border-border/60 shadow-sm lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      {activeProduct.nombre}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {activeProduct.descripcion || "Sin descripción"}
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {[
                      {
                        label: "Ingresos",
                        value: formatCurrency(activeProduct.ingresoTotal)
                      },
                      {
                        label: "Unidades vendidas",
                        value: activeProduct.unidadesVendidas.toLocaleString("es-AR")
                      },
                      {
                        label: "Transacciones",
                        value: activeProduct.numeroTransacciones.toLocaleString("es-AR")
                      },
                      {
                        label: "Ticket promedio",
                        value:
                          activeProduct.numeroTransacciones > 0
                            ? formatCurrency(activeProduct.ingresoTotal / activeProduct.numeroTransacciones)
                            : formatCurrency(activeProduct.ingresoTotal)
                      }
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-border/60 bg-card/70 p-4"
                      >
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle>Otros productos del vendedor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vendorProducts.map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() => handleProductSelect(producto.id)}
                        className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                          producto.id === activeProduct.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <p className="font-semibold text-foreground">{producto.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {producto.unidadesVendidas} unidades · {formatCurrency(producto.ingresoTotal)}
                        </p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
