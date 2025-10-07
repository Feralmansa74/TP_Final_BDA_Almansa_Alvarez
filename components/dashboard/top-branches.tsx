import { Card } from "@/components/ui/card"
import { Store } from "lucide-react"

const branches = [
  { name: "Sucursal Centro", sales: 45200, percentage: 28 },
  { name: "Sucursal Norte", sales: 38900, percentage: 24 },
  { name: "Sucursal Sur", sales: 32100, percentage: 20 },
  { name: "Sucursal Este", sales: 28300, percentage: 18 },
  { name: "Sucursal Oeste", sales: 16000, percentage: 10 },
]

export function TopBranches() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="font-serif text-xl font-light text-foreground">Top Sucursales</h3>
        <p className="mt-1 text-sm text-muted-foreground">Por volumen de ventas</p>
      </div>
      <div className="space-y-4">
        {branches.map((branch, index) => (
          <div key={branch.name} className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Store className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">{branch.name}</p>
                <p className="text-sm font-medium text-foreground whitespace-nowrap">
                  ${branch.sales.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${branch.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{branch.percentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
