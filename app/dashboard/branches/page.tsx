"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  TrendingDown,
  ShoppingBag
} from "lucide-react"
import {
  getAllSucursales,
  createSucursal,
  updateSucursal,
  deleteSucursal,
  getUser,
  getSucursalesStats,
  getVendedoresBySucursal,
  getVendedorDetalle,
  getTopProductos,
  getRankingSucursales,
  type Sucursal,
  type SucursalFormData,
  type SucursalesStats,
  type BranchSummary,
  type VendedorDetalle,
  type DateRangeFilter
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

interface BranchVendor {
  id: number
  nombre: string
  apellido: string
  dni: string
  numeroVentas: number
  ventasTotales: number
}

interface RankingEntry {
  id: number
  nombre: string
  ventasTotales: number
  numeroCompras: number
  ticketPromedio: number
  porcentajeDelTotal?: number
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
  const [focusedBranchId, setFocusedBranchId] = useState<number | null>(null)
  const [focusedBranchVendors, setFocusedBranchVendors] = useState<BranchVendor[]>([])
  const [isFocusedBranchLoading, setIsFocusedBranchLoading] = useState(false)
  const [focusedBranchError, setFocusedBranchError] = useState("")
  const [focusedBranchProducts, setFocusedBranchProducts] = useState<
    Array<{
      id: number
      nombre: string
      categoria: string
      unidadesVendidas: number
      ingresoTotal: number
      numeroTransacciones: number
    }>
  >([])
  const [isFocusedProductsLoading, setIsFocusedProductsLoading] = useState(false)
  const [focusedProductsError, setFocusedProductsError] = useState("")
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false)
  const [isVendorDetailLoading, setIsVendorDetailLoading] = useState(false)
  const [vendorDetailError, setVendorDetailError] = useState("")
  const [vendorDetail, setVendorDetail] = useState<VendedorDetalle | null>(null)
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  })
  const [appliedFocusedRange, setAppliedFocusedRange] = useState<DateRangeFilter | null>(null)
  const [focusedRangeData, setFocusedRangeData] = useState<RankingEntry | null>(null)
  const [isFocusedRangeLoading, setIsFocusedRangeLoading] = useState(false)
  const [focusedRangeError, setFocusedRangeError] = useState("")

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

  const handleFocusToggle = (branchId: number) => {
    if (focusedBranchId === branchId) {
      setFocusedBranchId(null)
      setCustomRange({ start: "", end: "" })
      setFocusedRangeData(null)
      setAppliedFocusedRange(null)
      setFocusedRangeError("")
      return
    }
    setFocusedBranchId(branchId)
    setFocusedRangeData(null)
    setAppliedFocusedRange(null)
    setFocusedRangeError("")
  }

  const handleApplyFocusedRange = async () => {
    if (!focusedBranchId) {
      return
    }
    if (!customRange.start || !customRange.end) {
      alert("Selecciona fecha inicio y fin")
      return
    }
    const range: DateRangeFilter = {
      fechaInicio: customRange.start,
      fechaFin: customRange.end
    }
    setIsFocusedRangeLoading(true)
    setFocusedRangeError("")
    try {
      const response = await getRankingSucursales(range)
      if (response.success && response.data) {
        const entry = response.data.find((item) => item.id === focusedBranchId)
        if (entry) {
          setFocusedRangeData({
            id: entry.id,
            nombre: entry.nombre,
            ventasTotales: entry.ventasTotales,
            numeroCompras: entry.numeroCompras,
            ticketPromedio: entry.ticketPromedio,
            porcentajeDelTotal: entry.porcentajeDelTotal
          })
          setAppliedFocusedRange(range)
        } else {
          setFocusedRangeData(null)
          setAppliedFocusedRange(range)
          setFocusedRangeError("La sucursal no registra ventas en este periodo.")
        }
      } else {
        setFocusedRangeData(null)
        setFocusedRangeError(response.message || "No se pudo calcular el periodo.")
      }
    } catch (error) {
      console.error("Error al aplicar filtro de periodo:", error)
      setFocusedRangeData(null)
      setFocusedRangeError("Ocurrió un error al aplicar el filtro.")
    } finally {
      setIsFocusedRangeLoading(false)
    }
  }

  const handleClearFocusedRange = () => {
    setCustomRange({ start: "", end: "" })
    setFocusedRangeData(null)
    setFocusedRangeError("")
    setAppliedFocusedRange(null)
  }

  const handleVendorCardClick = async (vendorId: number) => {
    setVendorDetail(null)
    setVendorDetailError("")
    setIsVendorModalOpen(true)
    setIsVendorDetailLoading(true)
    try {
      const response = await getVendedorDetalle(vendorId)
      if (response.success && response.data) {
        setVendorDetail(response.data)
      } else {
        setVendorDetailError(response.message || "No se pudo obtener el detalle del vendedor.")
      }
    } catch (error) {
      console.error("Error al obtener detalle del vendedor:", error)
      setVendorDetailError("No se pudo obtener el detalle del vendedor.")
    } finally {
      setIsVendorDetailLoading(false)
    }
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

  const getVendorStatus = (ventas: number) => {
    if (ventas === 0) {
      return { label: "Bajo", badge: "bg-rose-50 text-rose-600 border border-rose-200" }
    }
    if (ventas > 10) {
      return { label: "Excelente", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200" }
    }
    if (ventas > 5) {
      return { label: "Bien", badge: "bg-amber-50 text-amber-700 border border-amber-200" }
    }
    return { label: "En progreso", badge: "bg-blue-50 text-blue-700 border border-blue-200" }
  }

  const branchSummaryMap = useMemo(() => {
    const map = new Map<number, BranchSummary>()
    if (stats) {
      stats.ventasPorSucursal.forEach((item) => {
        map.set(item.id, item)
      })
    }
    return map
  }, [stats])

  useEffect(() => {
    if (focusedBranchId && !branchSummaryMap.has(focusedBranchId)) {
      setFocusedBranchId(null)
    }
  }, [branchSummaryMap, focusedBranchId])

  useEffect(() => {
    if (!focusedBranchId) {
      setFocusedBranchVendors([])
      setFocusedBranchProducts([])
      setFocusedBranchError("")
      setFocusedProductsError("")
      setFocusedRangeData(null)
      setFocusedRangeError("")
      setAppliedFocusedRange(null)
      setIsFocusedBranchLoading(false)
      setIsFocusedProductsLoading(false)
      setIsFocusedRangeLoading(false)
      return
    }

    let isMounted = true
    const filters = appliedFocusedRange
      ? { ...appliedFocusedRange }
      : undefined
    setIsFocusedBranchLoading(true)
    setFocusedBranchError("")
    setIsFocusedProductsLoading(true)
    setFocusedProductsError("")

    getVendedoresBySucursal(focusedBranchId, filters)
      .then((response) => {
        if (!isMounted) return
        if (response.success && response.data) {
          setFocusedBranchVendors(
            response.data.map((vendor) => ({
              id: vendor.id,
              nombre: vendor.nombre,
              apellido: vendor.apellido,
              dni: vendor.dni,
              numeroVentas: vendor.numeroVentas,
              ventasTotales: vendor.ventasTotales
            }))
          )
        } else {
          setFocusedBranchVendors([])
          setFocusedBranchError(response.message || "No se pudieron obtener los vendedores.")
        }
      })
      .catch((error) => {
        console.error("Error al obtener vendedores por sucursal:", error)
        if (!isMounted) return
        setFocusedBranchVendors([])
        setFocusedBranchError("No se pudieron obtener los vendedores.")
      })
      .finally(() => {
        if (isMounted) {
          setIsFocusedBranchLoading(false)
        }
      })

    getTopProductos({
      limit: 8,
      sucursalId: focusedBranchId,
      filters
    })
      .then((response) => {
        if (!isMounted) return
        if (response.success && response.data) {
          setFocusedBranchProducts(response.data)
        } else {
          setFocusedBranchProducts([])
          setFocusedProductsError(response.message || "No se pudieron obtener los productos.")
        }
      })
      .catch((error) => {
        console.error("Error al obtener productos por sucursal:", error)
        if (!isMounted) return
        setFocusedBranchProducts([])
        setFocusedProductsError("No se pudieron obtener los productos.")
      })
      .finally(() => {
        if (isMounted) {
          setIsFocusedProductsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [focusedBranchId, appliedFocusedRange])

  const barData = useMemo(
    () =>
      ventasPorSucursal.map((item) => ({
        id: item.id,
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
        id: item.id,
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

  const focusedBranchSummary = useMemo(
    () => (focusedBranchId ? branchSummaryMap.get(focusedBranchId) ?? null : null),
    [branchSummaryMap, focusedBranchId]
  )

  const focusedBranchKPIs = useMemo(() => {
    const source = focusedRangeData ?? focusedBranchSummary
    if (!source) {
      return null
    }
    const totalTransacciones =
      "numeroVentas" in source && typeof source.numeroVentas === "number"
        ? source.numeroVentas
        : (source as RankingEntry).numeroCompras
    const baseTicket =
      totalTransacciones > 0 ? source.ventasTotales / totalTransacciones : 0
    const baseShare =
      ("porcentajeParticipacion" in source && typeof source.porcentajeParticipacion === "number"
        ? source.porcentajeParticipacion
        : (source as RankingEntry).porcentajeDelTotal) ?? 0
    const ventasEstimadas =
      focusedRangeData?.ventasTotales ??
      (stats ? (stats.ventasUltimoMes * baseShare) / 100 : source.ventasTotales)

    return {
      ticketPromedio: baseTicket,
      share: baseShare,
      ventasTotales: source.ventasTotales,
      numeroVentas: totalTransacciones,
      ventasEstimadas
    }
  }, [focusedBranchSummary, focusedRangeData, stats])

  const displayedBarData = useMemo(() => {
    if (focusedBranchId) {
      const match = barData.find((item) => item.id === focusedBranchId)
      return match ? [match] : barData
    }
    return barData
  }, [barData, focusedBranchId])

  const displayedPieData = useMemo(() => {
    if (focusedBranchId) {
      const match = pieData.find((item) => item.id === focusedBranchId)
      return match ? [match] : pieData
    }
    return pieData
  }, [pieData, focusedBranchId])

  const focusedProductsBarData = useMemo(
    () =>
      focusedBranchProducts.map((product) => ({
        id: product.id,
        nombre: product.nombre,
        ventas: product.unidadesVendidas,
        ingreso: product.ingresoTotal,
        categoria: product.categoria
      })),
    [focusedBranchProducts]
  )

  const vendorShareData = useMemo(() => {
    if (!focusedBranchId || focusedBranchVendors.length === 0) {
      return []
    }
    const total = focusedBranchVendors.reduce((sum, vendor) => sum + vendor.ventasTotales, 0)
    if (total === 0) {
      return []
    }
    return focusedBranchVendors.map((vendor) => ({
      id: vendor.id,
      name: `${vendor.nombre} ${vendor.apellido}`,
      value: vendor.ventasTotales,
      percentage: (vendor.ventasTotales / total) * 100
    }))
  }, [focusedBranchId, focusedBranchVendors])

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

  const renderProductsTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null
    }
    const data = payload[0].payload
    return (
      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm">
        <p className="font-medium text-foreground">{data.nombre}</p>
        <p className="text-muted-foreground">Unidades: {formatNumber(data.ventas)}</p>
        <p className="text-muted-foreground">
          Ingreso: {data.ingreso ? formatCurrency(data.ingreso) : "-"}
        </p>
      </div>
    )
  }

  const renderVendorShareTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null
    }
    const data = payload[0].payload
    return (
      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-muted-foreground">Ventas: {formatCurrency(data.value)}</p>
        <p className="text-muted-foreground">
          Participacion: {data.percentage.toFixed(1)}%
        </p>
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
            {focusedBranchSummary && (
              <Card className="border-primary/40 bg-primary/5 shadow-sm">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sucursal enfocada</p>
                    <h3 className="text-2xl font-serif text-foreground">
                      {focusedBranchSummary.nombre}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Ventas {formatCurrency(focusedBranchSummary.ventasTotales)} ·{" "}
                      {formatNumber(focusedBranchSummary.numeroVentas)} transacciones ·{" "}
                      {formatNumber(focusedBranchSummary.numeroVendedores)} vendedores
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setFocusedBranchId(null)}>
                    Quitar foco
                  </Button>
                </CardContent>
              </Card>
            )}
            {focusedBranchSummary && focusedBranchKPIs && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Ventas {focusedRangeData && appliedFocusedRange ? "del periodo" : "últimos 30 días"}
                    </p>
                    <p className="text-2xl font-light text-foreground">
                      {formatCurrency(focusedBranchKPIs.ventasEstimadas)}
                    </p>
                    {focusedRangeData && appliedFocusedRange ? (
                      <p className="text-xs text-muted-foreground">
                        {appliedFocusedRange.fechaInicio} - {appliedFocusedRange.fechaFin}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Según la participación actual de la sucursal
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Ticket promedio</p>
                    <p className="text-2xl font-light text-foreground">
                      {formatCurrency(focusedBranchKPIs.ticketPromedio)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(focusedBranchKPIs.numeroVentas)} transacciones
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Participacion sobre el total</p>
                    <p className="text-2xl font-light text-foreground">
                      {focusedBranchKPIs.share.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Cuota de ventas corporativas</p>
                  </CardContent>
                </Card>
              </div>
            )}
            {focusedBranchId && (
              <Card className="border-border/50 bg-card/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Filtrar rendimiento por periodo</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Selecciona un rango de fechas para analizar las ventas de esta sucursal.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Fecha inicio</label>
                      <Input
                        type="date"
                        value={customRange.start}
                        onChange={(event) =>
                          setCustomRange((prev) => ({ ...prev, start: event.target.value }))
                        }
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Fecha fin</label>
                      <Input
                        type="date"
                        value={customRange.end}
                        onChange={(event) =>
                          setCustomRange((prev) => ({ ...prev, end: event.target.value }))
                        }
                        className="h-9"
                      />
                    </div>
                    <Button onClick={handleApplyFocusedRange} disabled={isFocusedRangeLoading}>
                      {isFocusedRangeLoading ? "Aplicando..." : "Aplicar"}
                    </Button>
                    <Button variant="ghost" onClick={handleClearFocusedRange}>
                      Limpiar
                    </Button>
                  </div>
                  {focusedRangeError && (
                    <p className="text-sm text-rose-600">{focusedRangeError}</p>
                  )}
                  {focusedRangeData && appliedFocusedRange && (
                    <div className="rounded-lg border border-border/60 bg-white/70 p-4">
                      <p className="text-xs text-muted-foreground uppercase">
                        {appliedFocusedRange.fechaInicio} - {appliedFocusedRange.fechaFin}
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Ventas totales</p>
                          <p className="text-lg font-semibold text-foreground">
                            {formatCurrency(focusedRangeData.ventasTotales)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Transacciones</p>
                          <p className="text-lg font-semibold text-foreground">
                            {formatNumber(focusedRangeData.numeroCompras)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ticket promedio</p>
                          <p className="text-lg font-semibold text-foreground">
                            {formatCurrency(focusedRangeData.ticketPromedio)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {focusedBranchId ? (
                      <>
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        Productos más vendidos
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Ventas por sucursal
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {focusedBranchId ? (
                    isFocusedProductsLoading ? (
                      <div className="flex h-[300px] items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : focusedProductsError ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {focusedProductsError}
                      </div>
                    ) : focusedProductsBarData.length === 0 ? (
                      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                        La sucursal aún no registra productos vendidos.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={focusedProductsBarData}
                          margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="nombre"
                            height={80}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            angle={-35}
                            textAnchor="end"
                          />
                          <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                          <Tooltip content={renderProductsTooltip} cursor={{ fill: "#f1f5f9" }} />
                          <Bar dataKey="ventas" radius={[8, 8, 0, 0]}>
                            {focusedProductsBarData.map((item, index) => (
                              <Cell
                                key={item.id}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  ) : barData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      No hay datos de ventas registrados.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={displayedBarData}
                        margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                      >
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
                          {displayedBarData.map((item, index) => (
                            <Cell
                              key={item.id}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
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
                    {focusedBranchId ? (
                      <>
                        <Users className="h-5 w-5 text-primary" />
                        Participación por vendedor
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-5 w-5 text-primary" />
                        Participación de ventas
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {focusedBranchId ? (
                    isFocusedBranchLoading ? (
                      <div className="flex h-[300px] items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : vendorShareData.length === 0 ? (
                      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                        Aún no hay ventas registradas por vendedores en esta sucursal.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={vendorShareData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={4}
                            >
                              {vendorShareData.map((item, index) => (
                                <Cell
                                  key={item.id}
                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={renderVendorShareTooltip} />
                          </PieChart>
                        </ResponsiveContainer>
                        <ul className="flex-1 space-y-2">
                          {vendorShareData.slice(0, 4).map((item, index) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2 text-foreground">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                />
                                <span>{item.name}</span>
                              </div>
                              <span className="text-muted-foreground">
                                {item.percentage.toFixed(1)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  ) : pieData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      No hay informacion disponible.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={displayedPieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={4}
                          >
                            {displayedPieData.map((item, index) => (
                              <Cell
                                key={item.id}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={renderPieTooltip} />
                        </PieChart>
                      </ResponsiveContainer>
                      <ul className="flex-1 space-y-2">
                        {displayedPieData.slice(0, 4).map((item, index) => (
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
                            <span className="text-muted-foreground">
                              {formatPercentage(item.percentage)}
                            </span>
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

        {focusedBranchId && (
          <section className="space-y-4">
            <h2 className="text-2xl font-serif text-foreground">
              Equipo comercial {focusedBranchSummary ? `· ${focusedBranchSummary.nombre}` : ""}
            </h2>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Vendedores asociados</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Rendimiento individual dentro de la sucursal seleccionada.
                  </p>
                </div>
                {focusedBranchSummary && (
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(focusedBranchSummary.numeroVendedores)} vendedores totales
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {isFocusedBranchLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : focusedBranchError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {focusedBranchError}
                  </div>
                ) : focusedBranchVendors.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No hay vendedores con ventas registradas para esta sucursal.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {focusedBranchVendors.map((vendor) => {
                      const status = getVendorStatus(vendor.numeroVentas)
                      return (
                        <button
                          key={vendor.id}
                          type="button"
                          onClick={() => handleVendorCardClick(vendor.id)}
                          className="rounded-xl border border-border/60 bg-card/60 p-4 text-left shadow-sm transition hover:border-primary/50 hover:bg-primary/5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {vendor.nombre} {vendor.apellido}
                              </p>
                              <p className="text-xs text-muted-foreground">DNI {vendor.dni}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.badge}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Ventas</p>
                              <p className="font-semibold text-foreground">
                                {formatNumber(vendor.numeroVentas)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Monto</p>
                              <p className="font-semibold text-foreground">
                                {formatCurrency(vendor.ventasTotales)}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
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
                      <th className="px-6 py-4 text-center">Rendimiento</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {branches.map((branch) => {
                      const resumen = branchSummaryMap.get(branch.id)
                      const ventasBranch = resumen?.ventasTotales ?? branch.ventasTotales ?? 0
                      const semaforo = getSemaforo(ventasBranch)
                      const isFocused = focusedBranchId === branch.id

                      return (
                        <tr
                          key={branch.id}
                          className={`transition-colors hover:bg-muted/30 ${
                            isFocused ? "bg-primary/5" : ""
                          }`}
                        >
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
                          <td className="px-6 py-4 text-center">
                            <Button
                              variant={isFocused ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleFocusToggle(branch.id)}
                            >
                              {isFocused ? "Quitar foco" : "Ver rendimiento"}
                            </Button>
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

        {isVendorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="absolute inset-0" onClick={() => setIsVendorModalOpen(false)} />
            <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-border/60 bg-background p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Detalle de vendedor
                  </p>
                  <h3 className="text-2xl font-serif text-foreground">
                    {vendorDetail?.vendedor
                      ? `${vendorDetail.vendedor.nombre} ${vendorDetail.vendedor.apellido}`
                      : "Cargando..."}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {vendorDetail?.vendedor
                      ? `${vendorDetail.vendedor.sucursalNombre} · DNI ${vendorDetail.vendedor.dni}`
                      : "Analizando rendimiento"}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setIsVendorModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isVendorDetailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : vendorDetailError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {vendorDetailError}
                </div>
              ) : vendorDetail ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                      <p className="text-xs text-muted-foreground">Ventas del periodo</p>
                      <p className="text-xl font-semibold text-foreground">
                        {formatCurrency(vendorDetail.stats.ventasTotales)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                      <p className="text-xs text-muted-foreground">Ticket promedio</p>
                      <p className="text-xl font-semibold text-foreground">
                        {formatCurrency(vendorDetail.stats.ticketPromedio)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                      <p className="text-xs text-muted-foreground">Participación sucursal</p>
                      <p className="text-xl font-semibold text-foreground">
                        {vendorDetail.stats.participacionSucursal.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                      <p className="text-xs text-muted-foreground">Unidades vendidas</p>
                      <p className="text-xl font-semibold text-foreground">
                        {formatNumber(vendorDetail.stats.unidadesVendidas)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                      <p className="text-xs text-muted-foreground uppercase">Actividad</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Primera venta:{" "}
                        <span className="font-semibold text-foreground">
                          {vendorDetail.stats.primeraVenta ?? "Sin registro"}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Última venta:{" "}
                        <span className="font-semibold text-foreground">
                          {vendorDetail.stats.ultimaVenta ?? "Sin registro"}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                      <p className="text-xs text-muted-foreground uppercase">Resumen</p>
                      <p className="text-sm text-muted-foreground">
                        Ventas registradas:{" "}
                        <span className="font-semibold text-foreground">
                          {formatNumber(vendorDetail.stats.numeroVentas)}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Productos vendidos:{" "}
                        <span className="font-semibold text-foreground">
                          {formatNumber(vendorDetail.stats.productosVendidos)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Productos destacados
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {vendorDetail.productos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Este vendedor aún no registra productos vendidos en el periodo.
                        </p>
                      ) : (
                        vendorDetail.productos.slice(0, 6).map((producto) => (
                          <div
                            key={producto.id}
                            className="rounded-xl border border-border/60 bg-card/60 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {producto.nombre}
                                </p>
                                <p className="text-xs text-muted-foreground">{producto.categoria}</p>
                              </div>
                              <ShoppingBag className="h-4 w-4 text-primary" />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{producto.unidadesVendidas} unidades</span>
                              <span>{formatCurrency(producto.ingresoTotal)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


