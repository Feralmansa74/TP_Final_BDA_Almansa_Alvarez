import { Card } from "@/components/ui/card"
import { Package } from "lucide-react"

const recentSales = [
  {
    product: "Laptop HP ProBook",
    branch: "Sucursal Centro",
    amount: 1200,
    date: "2 min ago",
  },
  {
    product: "Mouse Logitech MX",
    branch: "Sucursal Norte",
    amount: 89,
    date: "15 min ago",
  },
  {
    product: "Teclado Mecánico",
    branch: "Sucursal Sur",
    amount: 150,
    date: "1 hora ago",
  },
  {
    product: 'Monitor Samsung 27"',
    branch: "Sucursal Este",
    amount: 450,
    date: "2 horas ago",
  },
  {
    product: "Webcam Logitech C920",
    branch: "Sucursal Centro",
    amount: 120,
    date: "3 horas ago",
  },
]

export function RecentSales() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="font-serif text-xl font-light text-foreground">Ventas Recientes</h3>
        <p className="mt-1 text-sm text-muted-foreground">Últimas transacciones realizadas</p>
      </div>
      <div className="space-y-4">
        {recentSales.map((sale, index) => (
          <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Package className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{sale.product}</p>
              <p className="text-xs text-muted-foreground">{sale.branch}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">${sale.amount}</p>
              <p className="text-xs text-muted-foreground">{sale.date}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
