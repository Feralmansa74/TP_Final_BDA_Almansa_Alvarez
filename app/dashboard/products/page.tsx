"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  BarChart3,
  Calendar,
  DollarSign,
  Loader2,
  Package,
  RefreshCcw,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  X
} from "lucide-react"
import {
  getProductoDetalleVentas,
  getProductosInsights,
  getProductosVentasSerie,
  type ProductoDetalleResponse,
  type ProductosInsights,
  type ProductosVentasSeriePoint
} from "@/lib/api"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

type Granularity = "dia" | "semana" | "mes"

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

const toInputDate = (date: Date) => date.toISOString().split("T")[0]

const buildQuickRange = (days: number) => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  return { start: toInputDate(start), end: toInputDate(end) }
}

const QUICK_RANGES: Array<{ label: string; days: number }> = [
  { label: "30d", days: 30 },
  { label: "60d", days: 60 },
  { label: "90d", days: 90 }
]

export default function ProductsAnalyticsPage() {
  const defaultRange = buildQuickRange(30)
  const [range, setRange] = useState(defaultRange)
  const [granularity, setGranularity] = useState<Granularity>("dia")

  const [insights, setInsights] = useState<ProductosInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [insightsError, setInsightsError] = useState("")

  const [serie, setSerie] = useState<ProductosVentasSeriePoint[]>([])
  const [serieLoading, setSerieLoading] = useState(true)
  const [serieError, setSerieError] = useState("")
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [productDetail, setProductDetail] = useState<ProductoDetalleResponse | null>(null)
  const [productDetailLoading, setProductDetailLoading] = useState(false)
  const [productDetailError, setProductDetailError] = useState("")
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true)
    setInsightsError("")
    try {
      const response = await getProductosInsights({
        fechaInicio: range.start,
        fechaFin: range.end,
        limit: 5
      })
      if (response.success && response.data) {
        setInsights(response.data)
      } else {
        setInsights(null)
        setInsightsError(response.message || "No se pudo obtener la informacion de productos.")
      }
    } catch (error) {
      console.error("Error al cargar insights de productos:", error)
      setInsights(null)
      setInsightsError("No se pudo obtener la informacion de productos.")
    } finally {
      setInsightsLoading(false)
    }
  }, [range])

  const loadSerie = useCallback(async () => {
    setSerieLoading(true)
    setSerieError("")
    try {
      const response = await getProductosVentasSerie({
        fechaInicio: range.start,
        fechaFin: range.end,
        granularidad: granularity
      })
      if (response.success && response.data) {
        setSerie(response.data)
      } else {
        setSerie([])
        setSerieError(response.message || "No se pudo obtener la serie temporal.")
      }
    } catch (error) {
      console.error("Error al cargar serie temporal de productos:", error)
      setSerie([])
      setSerieError("No se pudo obtener la serie temporal.")
    } finally {
      setSerieLoading(false)
    }
  }, [granularity, range])

  useEffect(() => {
    void loadInsights()
  }, [loadInsights])

  useEffect(() => {
    void loadSerie()
  }, [loadSerie])

  const resumen = insights?.resumen

  const kpiCards = useMemo(() => {
    if (!resumen) return []
    return [
      {
        label: "Ingresos del periodo",
        value: formatCurrency(resumen.ingresoTotal),
        helper: `${formatNumber(resumen.numeroTransacciones)} transacciones`,
        icon: DollarSign
      },
      {
        label: "Unidades vendidas",
        value: formatNumber(resumen.unidadesVendidas),
        helper: `${formatCurrency(resumen.ventasPromedioDia)} promedio diario`,
        icon: Package
      },
      {
        label: "Ticket promedio",
        value: formatCurrency(resumen.ticketPromedio),
        helper: `${formatNumber(resumen.productosConVentas)} productos con movimiento`,
        icon: ShoppingBag
      },
      {
        label: "Stock disponible",
        value: formatNumber(resumen.stockDisponible),
        helper: `${formatNumber(resumen.productosActivos)} SKU activos`,
        icon: BarChart3
      }
    ]
  }, [resumen])

  const chartMaxY = useMemo(() => {
    if (!serie.length) return 0
    return serie.reduce((max, item) => Math.max(max, item.unidadesVendidas), 0)
  }, [serie])

  const handleQuickRange = (days: number) => {
    setRange(buildQuickRange(days))
  }

  const handleManualRefresh = () => {
    void loadInsights()
    void loadSerie()
  }

  const openProductDetail = async (productId: number) => {
    setSelectedProductId(productId)
    setProductDetail(null)
    setProductDetailError("")
    setIsProductModalOpen(true)
    setProductDetailLoading(true)
    try {
      const response = await getProductoDetalleVentas(productId, {
        fechaInicio: range.start,
        fechaFin: range.end
      })
      if (response.success && response.data) {
        setProductDetail(response.data)
      } else {
        setProductDetailError(response.message || "No se pudo cargar el detalle del producto.")
      }
    } catch (error) {
      console.error("Error al cargar detalle de producto:", error)
      setProductDetailError("No se pudo cargar el detalle del producto.")
    } finally {
      setProductDetailLoading(false)
    }
  }

  const closeProductModal = () => {
    setIsProductModalOpen(false)
    setSelectedProductId(null)
    setProductDetail(null)
    setProductDetailError("")
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border bg-white p-3 text-xs shadow">
          <p className="text-sm font-semibold text-foreground">{data.etiqueta}</p>
          <p className="text-muted-foreground">Unidades: {formatNumber(data.unidadesVendidas)}</p>
          <p className="text-muted-foreground">Ingresos: {formatCurrency(data.ingresoTotal)}</p>
          <p className="text-muted-foreground">Transacciones: {formatNumber(data.numeroTransacciones)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl space-y-8 px-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al dashboard
          </Link>
          <span>/</span>
          <span>Productos</span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Panel de control</p>
            <h1 className="font-serif text-3xl font-light text-foreground">Performance de productos</h1>
            <p className="text-sm text-muted-foreground">
              Todas las métricas se nutren en vivo de la base de datos MySQL.
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 rounded-full border-border/60 bg-card"
            onClick={handleManualRefresh}
          >
            <RefreshCcw className="h-4 w-4" />
            Actualizar datos
          </Button>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-serif text-foreground">Nivel productos - filtros y KPIs</h2>
            <p className="text-sm text-muted-foreground">
              Ajusta el periodo y revisa el rendimiento consolidado del catálogo.
            </p>
          </div>
          <Card className="rounded-3xl border border-border/50 bg-card shadow-sm">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Calendar className="h-4 w-4" />
                Filtro de periodo
              </div>
              <div className="flex flex-wrap gap-2 rounded-full border border-border/60 bg-muted/40 p-1">
                {QUICK_RANGES.map((option) => {
                  const preset = buildQuickRange(option.days)
                  const isActive = range.start === preset.start && range.end === preset.end
                  return (
                    <Button
                      key={option.days}
                      size="sm"
                      variant={isActive ? "default" : "ghost"}
                      className="rounded-full"
                      onClick={() => handleQuickRange(option.days)}
                    >
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Desde</p>
                <Input
                  type="date"
                  value={range.start}
                  onChange={(event) => setRange((prev) => ({ ...prev, start: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Hasta</p>
                <Input
                  type="date"
                  value={range.end}
                  onChange={(event) => setRange((prev) => ({ ...prev, end: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-xs font-medium text-muted-foreground">Granularidad del grafico</p>
                <div className="flex flex-wrap gap-2 rounded-full border border-border/60 bg-muted/40 p-1">
                  {(["dia", "semana", "mes"] as Granularity[]).map((option) => (
                    <Button
                      key={option}
                      size="sm"
                      variant={granularity === option ? "default" : "ghost"}
                      className="rounded-full"
                      onClick={() => setGranularity(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {insightsError && (
          <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{insightsError}</span>
          </div>
        )}

        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumen ejecutivo</p>
            <h3 className="text-xl font-serif text-foreground">Indicadores clave del periodo</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {insightsLoading ? (
              <div className="md:col-span-2 xl:col-span-4 flex items-center justify-center rounded-3xl border border-border/50 bg-card/50 py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              kpiCards.map((card) => (
                <Card key={card.label} className="rounded-3xl border border-border/50 bg-card shadow-sm">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <card.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
                      <p className="font-serif text-3xl font-light text-foreground">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.helper}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Nivel 2 - Portafolio</p>
            <h3 className="text-xl font-serif text-foreground">Productos más y menos dinámicos</h3>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl border border-border/50 bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top 5 productos</CardTitle>
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : insights && insights.topProductos.length > 0 ? (
                  <ul className="space-y-3">
                    {insights.topProductos.map((producto, index) => (
                      <button
                        type="button"
                        key={producto.id}
                        onClick={() => openProductDetail(producto.id)}
                        className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-3 text-left transition hover:border-primary/60 hover:bg-primary/5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {index + 1}. {producto.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {producto.categoriaNombre ?? "Sin categoria"} · {formatNumber(producto.unidadesVendidas)} unidades
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(producto.ingresoTotal)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(producto.numeroTransacciones)} tickets
                          </p>
                        </div>
                      </button>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin ventas registradas en este periodo.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border/50 bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>5 productos con menor dinamica</CardTitle>
                <ArrowDownRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : insights && insights.bottomProductos.length > 0 ? (
                  <ul className="space-y-3">
                    {insights.bottomProductos.map((producto) => (
                      <button
                        type="button"
                        key={producto.id}
                        onClick={() => openProductDetail(producto.id)}
                        className="flex w-full items-center justify-between rounded-2xl border border-dashed border-border/70 bg-background/40 p-3 text-left transition hover:border-destructive hover:bg-destructive/5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{producto.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {producto.categoriaNombre ?? "Sin categoria"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-destructive">
                            {formatNumber(producto.unidadesVendidas)} uds.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(producto.ingresoTotal)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Todos los productos registraron movimiento.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Nivel 3 - Equipos y territorios</p>
            <h3 className="text-xl font-serif text-foreground">Quién impulsa las ventas</h3>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="rounded-3xl border border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-primary" />
                  Vendedor destacado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : insights?.mejorVendedor ? (
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {insights.mejorVendedor.nombre} {insights.mejorVendedor.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {insights.mejorVendedor.sucursalNombre ?? "Sin sucursal"}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm">
                      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                        <span className="text-muted-foreground">Unidades</span>
                        <span className="font-semibold text-foreground">
                          {formatNumber(insights.mejorVendedor.unidadesVendidas)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                        <span className="text-muted-foreground">Ingresos</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(insights.mejorVendedor.ingresoTotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                        <span className="text-muted-foreground">Tickets</span>
                        <span className="font-semibold text-foreground">
                          {formatNumber(insights.mejorVendedor.numeroTransacciones)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin ventas en el rango seleccionado.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border/50 bg-card shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="h-5 w-5 text-primary" />
                  Rendimiento por sucursal
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {["mejorSucursal", "sucursalRezago"].map((key) => {
                  const data = (insights as ProductosInsights | null)?.[key as "mejorSucursal" | "sucursalRezago"]
                  const isBest = key === "mejorSucursal"
                  return (
                    <div
                      key={key}
                      className={`rounded-2xl border p-4 ${
                        isBest ? "border-emerald-200 bg-emerald-50/80" : "border-border/60 bg-background/60"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {isBest ? "Mayor aporte" : "Oportunidad"}
                      </p>
                      {data ? (
                        <>
                          <p className="mt-1 text-lg font-semibold text-foreground">{data.nombre}</p>
                          <div className="mt-3 grid gap-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Unidades</span>
                              <span className="font-semibold text-foreground">
                                {formatNumber(data.unidadesVendidas)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Ingresos</span>
                              <span className="font-semibold text-foreground">{formatCurrency(data.ingresoTotal)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">Sin datos suficientes.</p>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Nivel 4 - Tendencia</p>
              <h3 className="text-xl font-serif text-foreground">Evolución de ventas de productos</h3>
              <p className="text-sm text-muted-foreground">
                Serie temporal basada en Detalle_Compra con los filtros seleccionados.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 rounded-full border border-border/60 bg-muted/40 p-1">
              {(["dia", "semana", "mes"] as Granularity[]).map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={granularity === option ? "default" : "ghost"}
                  className="rounded-full"
                  onClick={() => setGranularity(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          <Card className="rounded-3xl border border-border/50 bg-card shadow-sm">
            <CardContent className="pt-6">
              {serieError && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{serieError}</span>
                </div>
              )}
              {serieLoading ? (
                <div className="flex h-[320px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : serie.length === 0 ? (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                  No hay datos para el periodo seleccionado.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={serie} margin={{ top: 20, right: 32, bottom: 8, left: 8 }}>
                    <CartesianGrid stroke="#f1f2f4" strokeDasharray="6 10" />
                    <XAxis
                      dataKey="etiqueta"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickLine={{ stroke: "#e5e7eb" }}
                      axisLine={{ stroke: "#d1d5db" }}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickLine={{ stroke: "#e5e7eb" }}
                      axisLine={{ stroke: "#d1d5db" }}
                      tickFormatter={(value) => `${formatNumber(value)} u`}
                      domain={[0, chartMaxY * 1.2]}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "#cbd5f5", strokeDasharray: "4 4" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="unidadesVendidas"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, stroke: "#2563eb", fill: "#fff" }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "#1d4ed8", fill: "#fff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeProductModal} />
          <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-border/60 bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Detalle de producto</p>
                <h2 className="text-2xl font-serif text-foreground">
                  {productDetail?.producto.nombre ?? "Producto"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {productDetail?.producto.categoriaNombre ?? "Sin categoria"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeProductModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {productDetailError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{productDetailError}</span>
              </div>
            )}

            {productDetailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : productDetail ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    {
                      label: "Precio unitario",
                      value: formatCurrency(productDetail.producto.precioUnitario)
                    },
                    {
                      label: "Stock disponible",
                      value: formatNumber(productDetail.producto.stockTotal)
                    },
                    {
                      label: "Sucursales con stock",
                      value: formatNumber(productDetail.producto.sucursalesConStock)
                    },
                    {
                      label: "Ventas periodo",
                      value: formatNumber(productDetail.stats.unidadesVendidas)
                    }
                  ].map((item) => (
                    <Card key={item.label} className="border-border/60">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground">Transacciones recientes</h3>
                  {productDetail.transacciones.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No se registraron operaciones para el rango seleccionado.
                    </p>
                  ) : (
                    <div className="mt-3 overflow-x-auto rounded-2xl border border-border/60">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Compra</th>
                            <th className="px-4 py-3">Vendedor</th>
                            <th className="px-4 py-3">Sucursal</th>
                            <th className="px-4 py-3 text-right">Unidades</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productDetail.transacciones.map((tx) => (
                            <tr key={tx.compraId} className="border-t text-foreground">
                              <td className="px-4 py-3">
                                {new Date(tx.fecha).toLocaleDateString("es-AR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">#{tx.compraId}</td>
                              <td className="px-4 py-3">
                                {tx.vendedorNombre} {tx.vendedorApellido}
                              </td>
                              <td className="px-4 py-3">{tx.sucursalNombre || "—"}</td>
                              <td className="px-4 py-3 text-right">{formatNumber(tx.unidades)}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(tx.totalLinea)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
