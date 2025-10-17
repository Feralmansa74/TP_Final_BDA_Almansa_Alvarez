"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, PieChart as PieChartIcon } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts"

interface CategoriaData {
  categoria: string
  numeroVentas: number
  unidadesVendidas: number
  ingresoTotal: number
}

interface Props {
  data: CategoriaData[]
  isLoading: boolean
}

// Colores para el gráfico de torta
const COLORS = ['hsl(var(--primary))', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export function CategoryPieChart({ data, isLoading }: Props) {
  
  // Formato de moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Calcular porcentajes
  const totalIngresos = data.reduce((sum, item) => sum + item.ingresoTotal, 0)
  
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: totalIngresos > 0 ? ((item.ingresoTotal / totalIngresos) * 100).toFixed(1) : 0
  }))

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-border">
          <p className="font-semibold text-sm text-foreground mb-2">
            {data.categoria}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-primary">
              <span className="font-medium">Ingresos:</span>{" "}
              {formatCurrency(data.ingresoTotal)}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Porcentaje:</span>{" "}
              {data.percentage}%
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Unidades:</span>{" "}
              {data.unidadesVendidas}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Ventas:</span>{" "}
              {data.numeroVentas}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  // Label personalizado para el gráfico
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent
  }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null // No mostrar labels para porcentajes muy pequeños

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Ventas por Categoría
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
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataWithPercentage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="ingresoTotal"
                >
                  {dataWithPercentage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm">
                      {entry.payload.categoria} ({entry.payload.percentage}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Leyenda adicional con detalles */}
            <div className="mt-4 space-y-2">
              {dataWithPercentage.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium text-foreground">
                      {item.categoria}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.ingresoTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.unidadesVendidas} unidades
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}