import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bell, Lock, User, Building, Palette, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Configuración</h1>
          <p className="mt-1 text-sm text-muted-foreground">Administra las preferencias del sistema</p>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Perfil</h3>
                <p className="text-sm text-muted-foreground">Actualiza tu información personal</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <input
                  type="text"
                  defaultValue="Administrador"
                  className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  defaultValue="admin@ventasapp.com"
                  className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button className="w-full">Guardar Cambios</Button>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Seguridad</h3>
                <p className="text-sm text-muted-foreground">Gestiona tu contraseña y seguridad</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Contraseña Actual</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button className="w-full">Cambiar Contraseña</Button>
            </div>
          </Card>

          {/* Notifications Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Notificaciones</h3>
                <p className="text-sm text-muted-foreground">Configura tus preferencias de notificaciones</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Notificaciones por Email</p>
                  <p className="text-xs text-muted-foreground">Recibe actualizaciones por correo</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Alertas de Ventas</p>
                  <p className="text-xs text-muted-foreground">Notificaciones de nuevas compras</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Alertas de Stock Bajo</p>
                  <p className="text-xs text-muted-foreground">Aviso cuando el inventario es bajo</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
              </div>
              <Button className="w-full">Guardar Preferencias</Button>
            </div>
          </Card>

          {/* Company Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Empresa</h3>
                <p className="text-sm text-muted-foreground">Información de tu negocio</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nombre de la Empresa</label>
                <input
                  type="text"
                  defaultValue="VentasApp"
                  className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Teléfono</label>
                <input
                  type="tel"
                  defaultValue="555-0100"
                  className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button className="w-full">Actualizar Información</Button>
            </div>
          </Card>

          {/* Appearance Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Apariencia</h3>
                <p className="text-sm text-muted-foreground">Personaliza la interfaz</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Tema</label>
                <select className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Claro</option>
                  <option>Oscuro</option>
                  <option>Automático</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Idioma</label>
                <select className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Español</option>
                  <option>English</option>
                  <option>Português</option>
                </select>
              </div>
              <Button className="w-full">Aplicar Cambios</Button>
            </div>
          </Card>

          {/* Database Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Base de Datos</h3>
                <p className="text-sm text-muted-foreground">Gestión de datos del sistema</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium text-foreground mb-2">Respaldo de Datos</p>
                <p className="text-xs text-muted-foreground mb-3">Último respaldo: Hace 2 días</p>
                <Button variant="outline" className="w-full bg-transparent">
                  Crear Respaldo
                </Button>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive mb-2">Zona de Peligro</p>
                <p className="text-xs text-muted-foreground mb-3">Eliminar todos los datos del sistema</p>
                <Button variant="destructive" className="w-full">
                  Limpiar Base de Datos
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
