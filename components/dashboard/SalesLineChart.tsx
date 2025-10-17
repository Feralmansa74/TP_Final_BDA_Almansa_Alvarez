"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function SalesLineChart() {
  const [data, setData] = useState<VentaData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const response = await getVentasPorPeriodo('dia', 30)
    
    if (response.success && response.data) {
      // Formatear los datos para el gráfico
      const formattedData = response.data.map(item => ({
        ...item,
        // Formatear fecha para mostrar solo día/mes
        fecha: new Date(item.fecha).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short'
        })
      }))
      setData(formattedData)
    }
    setIsLoading(false)
  }

  // Formato de moneda para el tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-border">
          <p className="font-semibold text-sm text-foreground mb-2">
            {payload[0].payload.fecha}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-primary">
              <span className="font-medium">Ventas:</span>{" "}
              {formatCurrency(payload[0].value)}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Transacciones:</span>{" "}
              {payload[0].payload.numeroTransacciones}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Ticket Promedio:</span>{" "}
              {formatCurrency(payload[0].payload.ticketPromedio)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Ventas de los Últimos 30 Días
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No hay datos disponibles
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="fecha"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="totalVentas"
                name="Ventas Totales"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}