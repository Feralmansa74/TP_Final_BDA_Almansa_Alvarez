"use client"

import { Card } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { month: "Ene", sales: 12500 },
  { month: "Feb", sales: 15200 },
  { month: "Mar", sales: 18900 },
  { month: "Abr", sales: 16400 },
  { month: "May", sales: 21300 },
  { month: "Jun", sales: 19800 },
]

export function SalesChart() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="font-serif text-xl font-light text-foreground">Compras Mensuales</h3>
        <p className="mt-1 text-sm text-muted-foreground">Últimos 6 meses</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-card p-3 shadow-lg">
                    <p className="text-sm font-medium text-foreground">${payload[0].value?.toLocaleString()}</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="sales" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
