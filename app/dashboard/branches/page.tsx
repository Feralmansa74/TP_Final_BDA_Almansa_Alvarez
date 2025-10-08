import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, MapPin, Phone, Package } from "lucide-react"

// Mock data basado en la estructura de la BD
const branches = [
  {
    id: 1,
    nombre: "Sucursal Centro",
    ubicacion: "Av. Principal 123, Centro",
    telefono: "555-0101",
    productos: 45,
    vendedores: 8,
  },
  {
    id: 2,
    nombre: "Sucursal Norte",
    ubicacion: "Calle Norte 456, Zona Norte",
    telefono: "555-0102",
    productos: 38,
    vendedores: 6,
  },
  {
    id: 3,
    nombre: "Sucursal Sur",
    ubicacion: "Av. Sur 789, Zona Sur",
    telefono: "555-0103",
    productos: 52,
    vendedores: 10,
  },
  {
    id: 4,
    nombre: "Sucursal Este",
    ubicacion: "Boulevard Este 321, Zona Este",
    telefono: "555-0104",
    productos: 41,
    vendedores: 7,
  },
  {
    id: 5,
    nombre: "Sucursal Oeste",
    ubicacion: "Calle Oeste 654, Zona Oeste",
    telefono: "555-0105",
    productos: 36,
    vendedores: 5,
  },
]

export default function BranchesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-light text-foreground">Sucursales</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gestiona las sucursales de tu negocio</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Sucursal
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sucursales</p>
                <p className="text-2xl font-light">{branches.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Productos Totales</p>
                <p className="text-2xl font-light">{branches.reduce((acc, b) => acc + b.productos, 0)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendedores Totales</p>
                <p className="text-2xl font-light">{branches.reduce((acc, b) => acc + b.vendedores, 0)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Branches Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Ubicación</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Teléfono</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Productos</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Vendedores</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{branch.nombre}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {branch.ubicacion}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {branch.telefono}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-foreground">{branch.productos}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-foreground">{branch.vendedores}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
