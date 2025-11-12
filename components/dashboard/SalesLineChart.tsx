"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getVentasPorPeriodo } from "@/lib/api"
import { Loader2, TrendingUp } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

interface VentaData {
  fecha: string
  totalVentas: number
  numeroTransacciones: number
  ticketPromedio: number
}

const PERIOD_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 }
] as const

const GRANULARITY_OPTIONS = [
  { label: "Diario", value: "dia" as const },
  { label: "Semanal", value: "semana" as const },
  { label: "Mensual", value: "mes" as const }
]

export function SalesLineChart() {
  const [data, setData] = useState<VentaData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [daysBack, setDaysBack] = useState<number>(30)
  const [granularity, setGranularity] = useState<"dia" | "semana" | "mes">("dia")

  useEffect(() => {
    void loadData()
  }, [daysBack, granularity])

  const loadData = async () => {
    setIsLoading(true)
    const response = await getVentasPorPeriodo(granularity, daysBack)

    if (response.success && response.data) {
      const formattedData = (response.data as VentaData[]).map(item => {
        const date = new Date(item.fecha)
        let label = date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })

        if (granularity === "semana") {
          const year = date.getFullYear().toString().slice(-2)
          const weekNumber = getISOWeek(date)
          label = `Sem ${weekNumber}-${year}`
        }

        if (granularity === "mes") {
          label = date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" })
        }

        return {
          ...item,
          fecha: label
        }
      })
      setData(formattedData)
    }
    setIsLoading(false)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-white p-3 shadow-lg">
          <p className="mb-2 text-sm font-semibold text-foreground">
            {payload[0].payload.fecha}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-primary">
              <span className="font-medium">Ventas:</span> {formatCurrency(payload[0].value)}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium">Transacciones:</span> {payload[0].payload.numeroTransacciones}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium">Ticket Promedio:</span> {formatCurrency(payload[0].payload.ticketPromedio)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const maxYValue = useMemo(() => {
    if (data.length === 0) return 0
    return data.reduce((max, item) => Math.max(max, item.totalVentas), 0)
  }, [data])

  const xAxisInterval = useMemo(() => {
    if (data.length <= 8) return 0
    return Math.ceil(data.length / 8)
  }, [data])

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Ventas de los Ultimos {daysBack} Dias
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
            {PERIOD_OPTIONS.map(option => (
              <Button
                key={option.value}
                size="sm"
                variant={daysBack === option.value ? "default" : "ghost"}
                onClick={() => setDaysBack(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
            {GRANULARITY_OPTIONS.map(option => (
              <Button
                key={option.value}
                size="sm"
                variant={granularity === option.value ? "default" : "ghost"}
                onClick={() => setGranularity(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[340px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[340px] items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="#f1f2f4" strokeDasharray="6 10" />
              <XAxis
                dataKey="fecha"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
                interval={xAxisInterval}
                tickMargin={12}
                axisLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={[0, maxYValue * 1.1]}
                axisLine={{ stroke: "#d1d5db" }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#cbd5f5", strokeDasharray: "4 4" }} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
              <Line
                type="monotone"
                dataKey="totalVentas"
                name="Ventas Totales"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: "#fff", stroke: "#2563eb", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#1d4ed8", fill: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

