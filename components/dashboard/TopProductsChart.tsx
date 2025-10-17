"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTopProductos } from "@/lib/api"
import { Loader2, Package } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"

interface ProductoData {
  id: number
  nombre: string
  categoria: string
  precioUnitario: number
  unidadesVendidas: number
  ingresoTotal: number
  numeroTransacciones: number
}

// Colores para las barras
const COLORS = [
  'hsl(var(--primary))',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#6366f1',
  '#f43f5e'
]

export function TopProductsChart() {
  const [data, setData] = useState<ProductoData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const response = await getTopProductos(8)
    
    if (response.success && response.data) {
      setData(response.data)
    }
    setIsLoading(false)
  }

  // Formato de moneda
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
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-border">
          <p className="font-semibold text-sm text-foreground mb-2">
            {data.nombre}
          </p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Categoría: {data.categoria}
            </p>
            <p className="text-sm text-primary">
              <span className="font-medium">Unidades:</span>{" "}
              {data.unidadesVendidas}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Ingresos:</span>{" "}
              {formatCurrency(data.ingresoTotal)}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Transacciones:</span>{" "}
              {data.numeroTransacciones}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  // Acortar nombres largos
  const truncateName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength) + '...'
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Top Productos Más Vendidos
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
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="nombre"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => truncateName(value, 15)}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                label={{ 
                  value: 'Unidades Vendidas', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: '#6b7280', fontSize: 12 }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="unidadesVendidas"
                radius={[8, 8, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}