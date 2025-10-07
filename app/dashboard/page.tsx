import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { TopBranches } from "@/components/dashboard/top-branches"
import { RecentSales } from "@/components/dashboard/recent-sales"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Dashboard de Ventas</h1>
          <p className="mt-2 text-muted-foreground">Resumen general de ventas por sucursal</p>
        </div>

        <StatsCards />

        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <SalesChart />
          </div>
          <div className="lg:col-span-3">
            <TopBranches />
          </div>
        </div>

        <RecentSales />
      </div>
    </DashboardLayout>
  )
}
