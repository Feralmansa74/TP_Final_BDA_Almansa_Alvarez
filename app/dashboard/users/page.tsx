"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  getAllUsers, 
  searchUsers, 
  deleteUser, 
  getUserStats,
  type User 
} from "@/lib/api"
import { 
  Users, 
  Search, 
  Trash2, 
  Edit, 
  Mail, 
  Calendar,
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Home,
  Shield
} from "lucide-react"

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    nuevosUltimaSemana: 0,
    nuevosUltimoMes: 0
  })
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers()
    loadStats()
  }, [])

  // Filtrar usuarios cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.mail.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  const loadUsers = async () => {
    setIsLoading(true)
    setErrorMessage("")

    const response = await getAllUsers()

    if (response.success && response.users) {
      setUsers(response.users)
      setFilteredUsers(response.users)
    } else {
      setErrorMessage(response.message)
    }

    setIsLoading(false)
  }

  const loadStats = async () => {
    const response = await getUserStats()
    if (response.success && response.stats) {
      setStats(response.stats)
    }
  }

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) {
      return
    }

    setErrorMessage("")
    setSuccessMessage("")

    const response = await deleteUser(id)

    if (response.success) {
      setSuccessMessage(`Usuario "${username}" eliminado exitosamente`)
      loadUsers()
      loadStats()
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000)
    } else {
      setErrorMessage(response.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header con navegación */}
      <div className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
              </Link>
              <div className="h-8 w-px bg-border"></div>
              <div>
                <h1 className="text-2xl font-serif tracking-tight text-foreground">
                  Gestión de Usuarios
                </h1>
                <p className="text-sm text-muted-foreground">
                  Administra los usuarios del sistema
                </p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Ir al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto p-8 space-y-6">

        {/* Mensajes */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 animate-in slide-in-from-top">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 animate-in slide-in-from-top">
            <AlertCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                  <p className="text-3xl font-light text-foreground">{stats.totalUsuarios}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10">
                  <TrendingUp className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Semana</p>
                  <p className="text-3xl font-light text-foreground">{stats.nuevosUltimaSemana}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-500/10">
                  <Calendar className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Último Mes</p>
                  <p className="text-3xl font-light text-foreground">{stats.nuevosUltimoMes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de búsqueda */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Input
                type="text"
                placeholder="Buscar por usuario o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Usuarios */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg">
              Usuarios ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border/50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                        Usuario
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                              <span className="text-sm font-semibold text-primary">
                                {user.usuario.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{user.usuario}</p>
                              {user.id === 1 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Shield className="h-3 w-3 text-primary" />
                                  <span className="text-xs text-primary font-medium">Administrador</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span>{user.mail}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>
                              {user.fechaCreacion
                                ? new Date(user.fechaCreacion).toLocaleDateString("es-AR", {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
                              onClick={() => alert("Funcionalidad de edición en desarrollo")}
                              title="Editar usuario"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              onClick={() => handleDeleteUser(user.id, user.usuario)}
                              disabled={user.id === 1}
                              title={user.id === 1 ? "No se puede eliminar el admin" : "Eliminar usuario"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}