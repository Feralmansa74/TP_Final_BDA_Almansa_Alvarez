"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  getUser, 
  removeUser, 
  getGeneralKPIs,
  getRankingSucursales,
  getVentasPorCategoria,
  type User 
} from "@/lib/api"
import { 
  LogOut, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Store,
  Package,
  Loader2,
  AlertCircle,
  ArrowRight
} from "lucide-react"
import { SalesLineChart } from "@/components/dashboard/SalesLineChart"
import { TopProductsChart } from "@/components/dashboard/TopProductsChart"
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [kpis, setKpis] = useState<any>(null)
  const [sucursales, setSucursales] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un usuario logueado
    const loggedUser = getUser()
    
    if (!loggedUser) {
      router.push("/login")
      return
    }
    
    setUser(loggedUser)
    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Cargar KPIs generales
      const kpisResponse = await getGeneralKPIs()
      if (kpisResponse.success && kpisResponse.data) {
        setKpis(kpisResponse.data)
      }

      // Cargar ranking de sucursales
      const sucursalesResponse = await getRankingSucursales()
      if (sucursalesResponse.success && sucursalesResponse.data) {
        setSucursales(sucursalesResponse.data)
      }

      // Cargar ventas por categoría
      const categoriasResponse = await getVentasPorCategoria()
      if (categoriasResponse.success && categoriasResponse.data) {
        setCategorias(categoriasResponse.data)
      }
    } catch (err) {
      console.error("Error cargando datos del dashboard:", err)
      setError("Error al cargar los datos del dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    removeUser()
    router.push("/login")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Mostrar loading mientras verifica el usuario
  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif tracking-tight text-foreground">
              Dashboard de Ventas
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido, <strong>{user.usuario}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/users">
              <Button variant="outline">
                Gestión de Usuarios
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* NIVEL 1 - KPIs GENERALES */}
        <div>
          <h2 className="text-2xl font-serif mb-4 text-foreground">
            📊 Indicadores Generales
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Ventas Totales */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Acumulado</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-light text-foreground">
                    {kpis ? formatCurrency(kpis.ventasTotales) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kpis?.totalTransacciones || 0} transacciones
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Promedio Mensual */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Promedio Diario</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-light text-foreground">
                    {kpis ? formatCurrency(kpis.promedioMensual) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Últimos 30 días
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Comparativa Mensual */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    {kpis && kpis.comparativa >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">vs. Mes Anterior</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className={`text-3xl font-light ${
                    kpis && kpis.comparativa >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpis ? `${kpis.comparativa > 0 ? '+' : ''}${kpis.comparativa}%` : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kpis ? formatCurrency(kpis.ventasMesActual) : '-'} este mes
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sucursales Activas */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Store className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Activas</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-light text-foreground">
                    {kpis?.totalSucursales || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sucursales
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* GRÁFICOS - Sección Principal */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de Ventas por Día */}
          <div className="lg:col-span-2">
            <SalesLineChart />
          </div>

          {/* Gráfico de Top Productos */}
          <TopProductsChart />

          {/* Gráfico de Categorías */}
          <CategoryPieChart data={categorias} isLoading={isLoading} />
        </div>

        {/* NIVEL 2 - RANKING DE SUCURSALES */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Ranking de Sucursales */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🏆 Ranking de Sucursales</span>
                  <Link href="/dashboard/branches">
                    <Button variant="ghost" size="sm" className="gap-2">
                      Ver más
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sucursales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay datos de sucursales
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sucursales.map((sucursal) => (
                      <div 
                        key={sucursal.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            #{sucursal.ranking}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{sucursal.nombre}</p>
                            <p className="text-sm text-muted-foreground">{sucursal.ubicacion}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatCurrency(sucursal.ventasTotales)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`h-2 w-2 rounded-full ${
                              sucursal.color === 'verde' ? 'bg-green-500' :
                              sucursal.color === 'amarillo' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <span className="text-xs text-muted-foreground">
                              {sucursal.porcentajeDelTotal}% del total
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ventas por Categoría */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>📦 Ventas por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {categorias.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay datos
                  </p>
                ) : (
                  <div className="space-y-4">
                    {categorias.map((cat, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{cat.categoria}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(cat.ingresoTotal)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${(cat.ingresoTotal / Math.max(...categorias.map(c => c.ingresoTotal))) * 100}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {cat.unidadesVendidas} unidades vendidas
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Acceso Rápido */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Acceso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Link href="/dashboard/users">
                <Button 
                  variant="outline" 
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Package className="h-6 w-6" />
                  <span className="font-medium">Gestión de Usuarios</span>
                </Button>
              </Link>

              <Button 
                variant="outline" 
                className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => alert("Funcionalidad en desarrollo")}
              >
                <Store className="h-6 w-6" />
                <span className="font-medium">Sucursales</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => alert("Funcionalidad en desarrollo")}
              >
                <Package className="h-6 w-6" />
                <span className="font-medium">Productos</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => alert("Funcionalidad en desarrollo")}
              >
                <ShoppingCart className="h-6 w-6" />
                <span className="font-medium">Reportes</span>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}