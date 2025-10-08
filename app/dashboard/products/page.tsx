import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Package, Tag, DollarSign } from "lucide-react"

// Mock data basado en la estructura de la BD
const products = [
  {
    id: 1,
    nombre: "Laptop HP Pavilion",
    descripcion: "Laptop de alto rendimiento con procesador Intel i7",
    precio_uni: 899.99,
    categoria: "Electrónica",
    stock: 15,
  },
  {
    id: 2,
    nombre: "Mouse Logitech MX Master",
    descripcion: "Mouse inalámbrico ergonómico para productividad",
    precio_uni: 99.99,
    categoria: "Accesorios",
    stock: 45,
  },
  {
    id: 3,
    nombre: "Teclado Mecánico RGB",
    descripcion: "Teclado mecánico con iluminación RGB personalizable",
    precio_uni: 149.99,
    categoria: "Accesorios",
    stock: 28,
  },
  {
    id: 4,
    nombre: 'Monitor Samsung 27"',
    descripcion: "Monitor 4K UHD de 27 pulgadas",
    precio_uni: 399.99,
    categoria: "Electrónica",
    stock: 12,
  },
  {
    id: 5,
    nombre: "Webcam Logitech C920",
    descripcion: "Cámara web Full HD 1080p",
    precio_uni: 79.99,
    categoria: "Accesorios",
    stock: 32,
  },
  {
    id: 6,
    nombre: "Auriculares Sony WH-1000XM4",
    descripcion: "Auriculares inalámbricos con cancelación de ruido",
    precio_uni: 349.99,
    categoria: "Audio",
    stock: 18,
  },
  {
    id: 7,
    nombre: "SSD Samsung 1TB",
    descripcion: "Disco de estado sólido NVMe de alta velocidad",
    precio_uni: 129.99,
    categoria: "Almacenamiento",
    stock: 40,
  },
  {
    id: 8,
    nombre: "Router TP-Link AX3000",
    descripcion: "Router WiFi 6 de doble banda",
    precio_uni: 159.99,
    categoria: "Redes",
    stock: 22,
  },
]

const categories = ["Todos", "Electrónica", "Accesorios", "Audio", "Almacenamiento", "Redes"]

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-light text-foreground">Productos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gestiona el catálogo de productos</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-light">{products.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categorías</p>
                <p className="text-2xl font-light">{categories.length - 1}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Total</p>
                <p className="text-2xl font-light">{products.reduce((acc, p) => acc + p.stock, 0)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Filter */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "Todos" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Producto</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Categoría</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Precio</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{product.nombre}</p>
                        <p className="text-sm text-muted-foreground">{product.descripcion}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {product.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">${product.precio_uni.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          product.stock < 20 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {product.stock} unidades
                      </span>
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
