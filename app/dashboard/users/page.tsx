import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Users, Mail, Calendar, Shield } from "lucide-react"

// Mock data basado en la estructura de la BD
const users = [
  {
    id: 1,
    usuario: "admin",
    mail: "admin@ventasapp.com",
    fecha_crea: "2024-01-15",
    rol: "Administrador",
    estado: "Activo",
  },
  {
    id: 2,
    usuario: "jperez",
    mail: "jperez@ventasapp.com",
    fecha_crea: "2024-02-20",
    rol: "Vendedor",
    estado: "Activo",
  },
  {
    id: 3,
    usuario: "mgarcia",
    mail: "mgarcia@ventasapp.com",
    fecha_crea: "2024-03-10",
    rol: "Vendedor",
    estado: "Activo",
  },
  {
    id: 4,
    usuario: "lrodriguez",
    mail: "lrodriguez@ventasapp.com",
    fecha_crea: "2024-03-25",
    rol: "Gerente",
    estado: "Activo",
  },
  {
    id: 5,
    usuario: "cmartinez",
    mail: "cmartinez@ventasapp.com",
    fecha_crea: "2024-04-05",
    rol: "Vendedor",
    estado: "Inactivo",
  },
  {
    id: 6,
    usuario: "alopez",
    mail: "alopez@ventasapp.com",
    fecha_crea: "2024-04-18",
    rol: "Vendedor",
    estado: "Activo",
  },
]

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-light text-foreground">Usuarios</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gestiona los usuarios del sistema</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-light">{users.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Activos</p>
                <p className="text-2xl font-light">{users.filter((u) => u.estado === "Activo").length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-light">{users.filter((u) => u.rol === "Administrador").length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Usuario</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Rol</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Fecha Creación</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-medium text-primary">
                            {user.usuario.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <p className="font-medium text-foreground">{user.usuario}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {user.mail}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          user.rol === "Administrador"
                            ? "bg-primary/10 text-primary"
                            : user.rol === "Gerente"
                              ? "bg-accent/10 text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {user.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.fecha_crea).toLocaleDateString("es-ES")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          user.estado === "Activo" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {user.estado}
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
