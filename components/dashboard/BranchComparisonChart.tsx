"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, BarChart3 } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts"

interface BranchData {
  id: number
  nombre: string
  ventasTotales: number
  porcentajeDelTotal?: number
}

interface BranchComparisonChartProps {
  data: BranchData[]
  isLoading: boolean
  periodLabel: string
  periodDescription: string
  onSelectBranch?: (branchId: number) => void
}

const COLORS = [
  "hsl(var(--primary))",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981"
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as BranchData & { porcentajeDelTotal?: number }
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{item.nombre}</p>
        <p className="text-sm text-primary">{formatCurrency(item.ventasTotales)}</p>
        {typeof item.porcentajeDelTotal === "number" && (
          <p className="text-xs text-muted-foreground">
            {item.porcentajeDelTotal.toFixed(1)}% del total
          </p>
        )}
      </div>
    )
  }
  return null
}

export function BranchComparisonChart({
  data,
  isLoading,
  periodLabel,
  periodDescription,
  onSelectBranch
}: BranchComparisonChartProps) {
  const hasData = data.length > 0
  const chartData = data.slice(0, 6)
  const topBranch = hasData ? data[0] : null
  const handleBarClick = (barData: any) => {
    if (!onSelectBranch) return
    const branchId = barData?.payload?.id
    if (typeof branchId === "number") {
      onSelectBranch(branchId)
    }
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Comparacion de sucursales
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {periodLabel} - {periodDescription}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !hasData ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No hay datos para comparar
          </div>
        ) : (
          <div className="space-y-5">
            {topBranch && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/40 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Mejor desempeno
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {topBranch.nombre}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Ventas</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(topBranch.ventasTotales)}
                  </p>
                  {typeof topBranch.porcentajeDelTotal === "number" && (
                    <p className="text-xs text-muted-foreground">
                      {topBranch.porcentajeDelTotal.toFixed(1)}% del total
                    </p>
                  )}
                </div>
                {onSelectBranch && (
                  <button
                    type="button"
                    onClick={() => onSelectBranch(topBranch.id)}
                    className="rounded-full border border-primary/40 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    Ver detalle
                  </button>
                )}
              </div>
            )}

            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="nombre"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(value: string) =>
                    value.length > 14 ? `${value.slice(0, 14)}...` : value
                  }
                  interval={0}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="ventasTotales"
                  radius={[8, 8, 0, 0]}
                  onClick={handleBarClick}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={COLORS[index % COLORS.length]}
                      cursor={onSelectBranch ? "pointer" : "default"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
