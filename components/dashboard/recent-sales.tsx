import { Card } from "@/components/ui/card"
import { Package, User } from "lucide-react"

const recentSales = [
  {
    product: "Laptop HP ProBook",
    branch: "Sucursal Centro",
    seller: "Juan Pérez",
    amount: 1200,
    date: "2024-10-07 14:30",
  },
  {
    product: "Mouse Logitech MX",
    branch: "Sucursal Norte",
    seller: "María García",
    amount: 89,
    date: "2024-10-07 14:15",
  },
  {
    product: "Teclado Mecánico",
    branch: "Sucursal Sur",
    seller: "Carlos López",
    amount: 150,
    date: "2024-10-07 13:45",
  },
  {
    product: 'Monitor Samsung 27"',
    branch: "Sucursal Este",
    seller: "Ana Martínez",
    amount: 450,
    date: "2024-10-07 12:30",
  },
  {
    product: "Webcam Logitech C920",
    branch: "Sucursal Centro",
    seller: "Juan Pérez",
    amount: 120,
    date: "2024-10-07 11:20",
  },
]

export function RecentSales() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="font-serif text-xl font-light text-foreground">Compras Recientes</h3>
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
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">{sale.branch}</p>
                <span className="text-xs text-muted-foreground">•</span>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{sale.seller}</p>
                </div>
              </div>
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
