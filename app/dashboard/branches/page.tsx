"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Store, 
  MapPin, 
  Phone, 
  Package, 
  Users, 
  Plus, 
  X, 
  Pencil, 
  Trash2,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowLeft
} from "lucide-react"
import {
  getAllSucursales,
  createSucursal,
  updateSucursal,
  deleteSucursal,
  getUser,
  type Sucursal,
  type SucursalFormData
} from "@/lib/api"

// ========================================
// INTERFACE PARA EL MODAL
// ========================================
interface BranchModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  branchData: Sucursal | null
  onSave: (data: SucursalFormData) => Promise<void>
}

// ========================================
// COMPONENTE: MODAL PARA AGREGAR/EDITAR
// ========================================
function BranchModal({ isOpen, onClose, mode, branchData, onSave }: BranchModalProps) {
  const [formData, setFormData] = useState<SucursalFormData>({
    nombre: '',
    ubicacion: '',
    telefono: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && branchData) {
      setFormData({
        nombre: branchData.nombre || '',
        ubicacion: branchData.ubicacion || '',
        telefono: branchData.telefono || ''
      })
    } else {
      setFormData({ nombre: '', ubicacion: '', telefono: '' })
    }
  }, [mode, branchData, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.ubicacion) {
      alert('Por favor completa nombre y ubicación')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error en handleSubmit:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === 'add' ? 'Nueva Sucursal' : 'Editar Sucursal'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre de la Sucursal *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Sucursal Centro"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ubicación *
            </label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              placeholder="Ej: Av. Principal 123, Centro"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: 555-0101"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                mode === 'add' ? 'Crear Sucursal' : 'Guardar Cambios'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function BranchesPage() {
  const router = useRouter()
  const [branches, setBranches] = useState<Sucursal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedBranch, setSelectedBranch] = useState<Sucursal | null>(null)
  
  // KPIs calculados
  const [totalSucursales, setTotalSucursales] = useState(0)
  const [totalVendedores, setTotalVendedores] = useState(0)
  const [totalProductos, setTotalProductos] = useState(0)
  const [ventasTotales, setVentasTotales] = useState(0)

  useEffect(() => {
    // Verificar autenticación
    const user = getUser()
    if (!user) {
      router.push('/login')
      return
    }

    loadBranchesData()
  }, [router])

  // ========================================
  // CARGAR DATOS
  // ========================================
  const loadBranchesData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getAllSucursales()
      
      if (response.success && response.data) {
        setBranches(response.data)
        
        // Calcular KPIs desde los datos
        const totales = response.data.reduce((acc, branch) => ({
          vendedores: acc.vendedores + (branch.numeroVendedores || 0),
          productos: acc.productos + (branch.numeroProductos || 0),
          ventas: acc.ventas + (branch.ventasTotales || 0)
        }), { vendedores: 0, productos: 0, ventas: 0 })

        setTotalSucursales(response.data.length)
        setTotalVendedores(totales.vendedores)
        setTotalProductos(totales.productos)
        setVentasTotales(totales.ventas)
      } else {
        setError(response.message || 'Error al cargar sucursales')
      }
    } catch (err) {
      console.error('Error cargando sucursales:', err)
      setError('Error de conexión con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  // ========================================
  // HANDLERS
  // ========================================
  const handleAddClick = () => {
    setModalMode('add')
    setSelectedBranch(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (branch: Sucursal) => {
    setModalMode('edit')
    setSelectedBranch(branch)
    setIsModalOpen(true)
  }

  const handleSave = async (formData: SucursalFormData) => {
    try {
      let response

      if (modalMode === 'add') {
        response = await createSucursal(formData)
      } else if (selectedBranch) {
        response = await updateSucursal(selectedBranch.id, formData)
      }

      if (response && response.success) {
        alert(modalMode === 'add' ? '✅ Sucursal creada exitosamente' : '✅ Sucursal actualizada exitosamente')
        await loadBranchesData()
      } else {
        alert('❌ Error: ' + (response?.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error guardando sucursal:', error)
      alert('❌ Error de conexión con el servidor')
    }
  }

  const handleDelete = async (branch: Sucursal) => {
    if (!confirm(`¿Estás seguro de eliminar la sucursal "${branch.nombre}"?`)) {
      return
    }

    try {
      const response = await deleteSucursal(branch.id)

      if (response.success) {
        alert('✅ Sucursal eliminada exitosamente')
        await loadBranchesData()
      } else {
        alert('❌ Error: ' + response.message)
      }
    } catch (error) {
      console.error('Error eliminando sucursal:', error)
      alert('❌ Error de conexión con el servidor')
    }
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Calcular color de semáforo según ventas
  const getSemaforo = (ventas: number) => {
    if (totalSucursales === 0) return { color: 'bg-gray-500', label: 'N/A' }
    
    const promedio = ventasTotales / totalSucursales
    if (ventas >= promedio * 1.2) return { color: 'bg-green-500', label: 'Excelente' }
    if (ventas >= promedio * 0.8) return { color: 'bg-yellow-500', label: 'Normal' }
    return { color: 'bg-red-500', label: 'Bajo' }
  }

  // ========================================
  // LOADING
  // ========================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando sucursales...</p>
        </div>
      </div>
    )
  }

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif tracking-tight text-foreground">
              Gestión de Sucursales
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra y monitorea el rendimiento de todas las sucursales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
            <Button onClick={handleAddClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Sucursal
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* KPIs */}
        <div>
          <h2 className="text-2xl font-serif mb-4 text-foreground">
            📊 Indicadores Generales
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Total Sucursales */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Store className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Activas</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-light text-foreground">
                    {totalSucursales}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sucursales totales
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Total Vendedores */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Personal</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-light text-foreground">
                    {totalVendedores}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vendedores activos
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Total Productos */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Inventario</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-light text-foreground">
                    {totalProductos}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Productos en stock
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ventas Totales */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Acumulado</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-light text-foreground">
                    {formatCurrency(ventasTotales)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ventas totales
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Tabla de Sucursales */}
        <div>
          <h2 className="text-2xl font-serif mb-4 text-foreground">
            🏪 Listado de Sucursales
          </h2>
          
          <Card>
            {branches.length === 0 ? (
              <div className="p-12 text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No hay sucursales registradas</p>
                <Button onClick={handleAddClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primera sucursal
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Estado</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Sucursal</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Ubicación</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Contacto</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Vendedores</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Stock</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Ventas</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((branch) => {
                      const semaforo = getSemaforo(branch.ventasTotales || 0)
                      return (
                        <tr key={branch.id} className="border-b hover:bg-muted/50 transition-colors">
                          {/* Semáforo */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-3 w-3 rounded-full ${semaforo.color}`}></div>
                              <span className="text-xs text-muted-foreground">{semaforo.label}</span>
                            </div>
                          </td>

                          {/* Nombre */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Store className="h-5 w-5 text-primary" />
                              </div>
                              <span className="text-sm font-medium text-foreground">{branch.nombre}</span>
                            </div>
                          </td>

                          {/* Ubicación */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-xs truncate">{branch.ubicacion}</span>
                            </div>
                          </td>

                          {/* Teléfono */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              {branch.telefono || 'N/A'}
                            </div>
                          </td>

                          {/* Vendedores */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{branch.numeroVendedores || 0}</span>
                            </div>
                          </td>

                          {/* Productos */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{branch.numeroProductos || 0}</span>
                            </div>
                          </td>

                          {/* Ventas */}
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-foreground">
                              {formatCurrency(branch.ventasTotales || 0)}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(branch)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(branch)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Modal */}
        <BranchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          branchData={selectedBranch}
          onSave={handleSave}
        />

      </div>
    </div>
  )
}