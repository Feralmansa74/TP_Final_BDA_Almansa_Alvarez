import { TrendingUp, TrendingDown, Store, Package, DollarSign } from "lucide-react"
import { Card } from "@/components/ui/card"

const stats = [
  {
    name: "Ventas Totales",
    value: "$124,500",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    name: "Sucursales Activas",
    value: "8",
    change: "+2",
    trend: "up" as const,
    icon: Store,
  },
  {
    name: "Productos Vendidos",
    value: "1,234",
    change: "-3.2%",
    trend: "down" as const,
    icon: Package,
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.name} className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <stat.icon className="h-6 w-6 text-accent" />
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === "up" ? "text-chart-1" : "text-destructive"
              }`}
            >
              {stat.trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {stat.change}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{stat.name}</p>
            <p className="mt-1 font-serif text-3xl font-light text-foreground">{stat.value}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
