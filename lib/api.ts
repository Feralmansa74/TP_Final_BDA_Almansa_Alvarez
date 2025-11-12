// lib/api.ts
// Servicio para hacer peticiones al backend

import axios from 'axios';

// URL base del backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Configuración de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// ============================================
// INTERFACES PARA TIPAR LOS DATOS
// ============================================

export interface LoginData {
  usuario: string;
  contraseña: string;
}

export interface RegisterData {
  usuario: string;
  contraseña: string;
  mail: string;
}

export interface User {
  id: number;
  usuario: string;
  mail: string;
  fechaCreacion?: string;
}

export interface UserDomainStat {
  dominio: string;
  cantidad: number;
  porcentaje: number;
}

export interface UsersStats {
  totalUsuarios: number;
  nuevosUltimaSemana: number;
  nuevosUltimoMes: number;
  nuevosMesAnterior: number;
  crecimientoMensual: number;
  promedioAntiguedadDias: number;
  usuariosSinEmail: number;
  usuarioMasReciente?: User | null;
  usuarioMasAntiguo?: User | null;
  dominiosPrincipales: UserDomainStat[];
}

export interface ApiResponse {
  success: boolean;
  message: string;
  user?: User;
}

// Filtros comunes para rangos de fechas
export interface DateRangeFilter {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface CategoriaVentasFilter extends DateRangeFilter {
  sucursalId?: number;
}

export interface VendedorDetalleProducto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  precioUnitario: number;
  unidadesVendidas: number;
  ingresoTotal: number;
  numeroTransacciones: number;
}

export interface VendedorDetalle {
  vendedor: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    sucursalId: number;
    sucursalNombre: string;
    sucursalUbicacion: string;
  };
  stats: {
    ventasTotales: number;
    numeroVentas: number;
    ticketPromedio: number;
    unidadesVendidas: number;
    productosVendidos: number;
    participacionSucursal: number;
    primeraVenta: string | null;
    ultimaVenta: string | null;
  };
  productos: VendedorDetalleProducto[];
}

export interface ProductoResumen {
  id: number;
  nombre: string;
  descripcion: string | null;
  precioUnitario: number;
  categoriaId: number | null;
  categoriaNombre: string | null;
  stockTotal?: number;
  sucursalesConStock?: number;
  unidadesVendidas: number;
  ingresoTotal: number;
  numeroTransacciones: number;
}

export interface ProductosResumenKPIs {
  productosActivos: number;
  stockDisponible: number;
  unidadesVendidas: number;
  ingresoTotal: number;
  numeroTransacciones: number;
  ticketPromedio: number;
  categoriasActivas: number;
  productosConVentas: number;
  ventasPromedioDia: number;
  diasConVentas: number;
  primeraVenta: string | null;
  ultimaVenta: string | null;
}

export interface LiderVendedor {
  id: number;
  nombre: string;
  apellido: string;
  sucursalNombre: string | null;
  unidadesVendidas: number;
  ingresoTotal: number;
  numeroTransacciones: number;
}

export interface LiderSucursal {
  id: number;
  nombre: string;
  unidadesVendidas: number;
  ingresoTotal: number;
}

export interface ProductosInsights {
  resumen: ProductosResumenKPIs;
  topProductos: ProductoResumen[];
  bottomProductos: ProductoResumen[];
  mejorVendedor: LiderVendedor | null;
  mejorSucursal: LiderSucursal | null;
  sucursalRezago: LiderSucursal | null;
}

export interface ProductosVentasSeriePoint {
  periodo: string;
  etiqueta: string;
  unidadesVendidas: number;
  ingresoTotal: number;
  numeroTransacciones: number;
}

export interface ProductoVentaDetalle {
  compraId: number;
  fecha: string;
  vendedorId: number | null;
  vendedorNombre: string;
  vendedorApellido: string;
  sucursalNombre: string;
  unidades: number;
  precioUnitario: number;
  totalLinea: number;
}

export interface ProductoDetalleStats {
  unidadesVendidas: number;
  ingresosTotales: number;
  numeroTransacciones: number;
  primeraVenta: string | null;
  ultimaVenta: string | null;
}

export interface ProductoDetalleResponse {
  producto: {
    id: number;
    nombre: string;
    descripcion: string | null;
    precioUnitario: number;
    categoriaNombre: string | null;
    stockTotal: number;
    sucursalesConStock: number;
  };
  stats: ProductoDetalleStats;
  transacciones: ProductoVentaDetalle[];
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Función para hacer login
 * @param usuario - Nombre de usuario
 * @param contraseña - Contraseña en texto plano
 * @returns Respuesta del servidor con los datos del usuario
 */
export const login = async (usuario: string, contraseña: string): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>('/auth/login', {
      usuario,
      contraseña,
    });
    return response.data;
  } catch (error: any) {
    // Manejo de errores
    if (error.response) {
      // El servidor respondió con un código de error
      return error.response.data;
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:3001',
      };
    } else {
      // Algo salió mal al configurar la petición
      return {
        success: false,
        message: 'Error al realizar la petición: ' + error.message,
      };
    }
  }
};

/**
 * Función para registrar un nuevo usuario
 * @param usuario - Nombre de usuario
 * @param contraseña - Contraseña en texto plano
 * @param mail - Correo electrónico
 * @returns Respuesta del servidor
 */
export const register = async (
  usuario: string,
  contraseña: string,
  mail: string
): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>('/auth/register', {
      usuario,
      contraseña,
      mail,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    } else if (error.request) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
      };
    } else {
      return {
        success: false,
        message: 'Error al realizar la petición: ' + error.message,
      };
    }
  }
};

/**
 * Guardar usuario en localStorage
 */
export const saveUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Obtener usuario de localStorage
 */
export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

/**
 * Eliminar usuario de localStorage (logout)
 */
export const removeUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};

// ============================================
// FUNCIONES DE GESTIÓN DE USUARIOS
// ============================================

/**
 * Obtener todos los usuarios
 */
export const getAllUsers = async (): Promise<{
  success: boolean;
  message: string;
  count?: number;
  users?: User[];
}> => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener un usuario por ID
 */
export const getUserById = async (id: number): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Buscar usuarios por término
 */
export const searchUsers = async (searchTerm: string): Promise<{
  success: boolean;
  message: string;
  count?: number;
  users?: User[];
}> => {
  try {
    const response = await api.get(`/users/search?search=${encodeURIComponent(searchTerm)}`);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener estadísticas de usuarios
 */
export const getUserStats = async (): Promise<{
  success: boolean;
  message: string;
  stats?: UsersStats;
}> => {
  try {
    const response = await api.get('/users/stats');
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Actualizar información de un usuario
 */
export const updateUser = async (
  id: number,
  data: { usuario?: string; mail?: string }
): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> => {
  try {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Cambiar contraseña de un usuario
 */
export const changePassword = async (
  id: number,
  contraseñaActual: string,
  contraseñaNueva: string
): Promise<ApiResponse> => {
  try {
    const response = await api.put(`/users/${id}/password`, {
      contraseñaActual,
      contraseñaNueva,
    });
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Eliminar un usuario
 */
export const deleteUser = async (id: number): Promise<ApiResponse> => {
  try {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

// ============================================
// FUNCIONES DEL DASHBOARD
// ============================================

/**
 * Obtener KPIs generales
 */
export const getGeneralKPIs = async (): Promise<{
  success: boolean;
  message: string;
  data?: {
    ventasTotales: number;
    promedioMensual: number;
    ventasMesActual: number;
    ventasMesAnterior: number;
    comparativa: number;
    totalTransacciones: number;
    totalSucursales: number;
    totalProductos: number;
  };
}> => {
  try {
    const response = await api.get('/dashboard/kpis');
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener ranking de sucursales
 */
export const getRankingSucursales = async (filters?: DateRangeFilter): Promise<{
  success: boolean;
  message: string;
  data?: Array<{
    id: number;
    nombre: string;
    ubicacion: string;
    ventasTotales: number;
    numeroCompras: number;
    ticketPromedio: number;
    ranking: number;
    porcentajeDelTotal: number;
    estado: string;
    color: string;
  }>;
}> => {
  try {
    const response = await api.get('/dashboard/sucursales/ranking', {
      params: filters
    });
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener ventas por categoría
 */
export const getVentasPorCategoria = async (filters?: CategoriaVentasFilter): Promise<{
  success: boolean;
  message: string;
  data?: Array<{
    categoria: string;
    numeroVentas: number;
    unidadesVendidas: number;
    ingresoTotal: number;
  }>;
}> => {
  try {
    const response = await api.get('/dashboard/categorias', {
      params: filters
    });
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener top productos
 */
export const getTopProductos = async ({
  limit = 10,
  sucursalId,
  filters
}: {
  limit?: number
  sucursalId?: number
  filters?: DateRangeFilter
} = {}): Promise<{
  success: boolean;
  message: string;
  data?: Array<{
    id: number;
    nombre: string;
    categoria: string;
    precioUnitario: number;
    unidadesVendidas: number;
    ingresoTotal: number;
    numeroTransacciones: number;
  }>;
}> => {
  try {
    const response = await api.get(`/dashboard/productos/top`, {
      params: {
        limit,
        sucursalId,
        ...filters
      }
    });
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener ventas por período
 */
export const getVentasPorPeriodo = async (
  periodo: 'dia' | 'semana' | 'mes' = 'dia',
  dias: number = 30
): Promise<{
  success: boolean;
  message: string;
  data?: Array<{
    fecha: string;
    totalVentas: number;
    numeroTransacciones: number;
    ticketPromedio: number;
  }>;
}> => {
  try {
    const response = await api.get(`/dashboard/ventas/periodo?periodo=${periodo}&dias=${dias}`);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

// ============================================
// FUNCIÓN DE MANEJO DE ERRORES
// ============================================
// FUNCIONES DE PRODUCTOS
// ============================================

export const getProductos = async (): Promise<{
  success: boolean;
  message: string;
  count?: number;
  products?: ProductoResumen[];
}> => {
  try {
    const response = await api.get('/productos');
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

export const getProductoById = async (id: number): Promise<{
  success: boolean;
  message: string;
  product?: ProductoResumen;
}> => {
  try {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

export const getProductosInsights = async (
  params?: DateRangeFilter & { limit?: number }
): Promise<{
  success: boolean;
  message: string;
  data?: ProductosInsights;
}> => {
  try {
    const response = await api.get('/dashboard/productos/insights', {
      params
    });
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

export const getProductosVentasSerie = async (
  params?: DateRangeFilter & { granularidad?: 'dia' | 'semana' | 'mes' }
): Promise<{
  success: boolean;
  message: string;
  data?: ProductosVentasSeriePoint[];
}> => {
  try {
    const response = await api.get('/dashboard/productos/ventas', {
      params
    });
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

export const getProductoDetalleVentas = async (
  id: number,
  params?: DateRangeFilter
): Promise<{
  success: boolean;
  message: string;
  data?: ProductoDetalleResponse;
}> => {
  try {
    const response = await api.get(`/dashboard/productos/${id}/detalle`, {
      params
    });
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

// ============================================
// FUNCIA"N DE MANEJO DE ERRORES
// ============================================

/**
 * Maneja errores de las peticiones HTTP
 */
const handleError = (error: any): any => {
  if (error.response) {
    // El servidor respondió con un código de error
    return error.response.data;
  } else if (error.request) {
    // La petición se hizo pero no hubo respuesta
    return {
      success: false,
      message: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
    };
  } else {
    // Algo salió mal al configurar la petición
    return {
      success: false,
      message: 'Error al realizar la petición: ' + error.message,
    };
  }
};
// ============================================
// INTERFACES PARA SUCURSALES
// ============================================

export interface Sucursal {
  id: number;
  nombre: string;
  ubicacion: string;
  telefono: string | null;
  numeroVendedores?: number;
  numeroProductos?: number;
  ventasTotales?: number;
  numeroVentas?: number;
}

export interface SucursalFormData {
  nombre: string;
  ubicacion: string;
  telefono?: string;
}

export interface BranchSummary {
  id: number;
  nombre: string;
  numeroVendedores: number;
  stockTotal: number;
  numeroProductos: number;
  ventasTotales: number;
  numeroVentas: number;
  porcentajeParticipacion: number;
}

export interface BranchMonthlySales {
  periodo: string;
  etiqueta: string;
  totalVentas: number;
  numeroVentas: number;
}

export interface SucursalesStats {
  totalSucursales: number;
  sucursalesConVentas: number;
  sucursalesSinVentas: number;
  totalVendedores: number;
  totalProductosEnStock: number;
  ventasTotales: number;
  ventasUltimoMes: number;
  promedioVentasSucursal: number;
  ticketPromedioUltimoMes: number;
  transaccionesUltimoMes: number;
  mejorSucursal: BranchSummary | null;
  sucursalConMenorVentas: BranchSummary | null;
  ventasPorSucursal: BranchSummary[];
  ventasMensuales: BranchMonthlySales[];
}

// ============================================
// FUNCIONES DE GESTIÓN DE SUCURSALES
// ============================================

/**
 * Obtener todas las sucursales
 */
export const getAllSucursales = async (): Promise<{
  success: boolean;
  message: string;
  count?: number;
  data?: Sucursal[];
}> => {
  try {
    const response = await api.get('/sucursales');
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener una sucursal por ID
 */
export const getSucursalById = async (id: number): Promise<{
  success: boolean;
  message: string;
  data?: Sucursal;
}> => {
  try {
    const response = await api.get(`/sucursales/${id}`);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener estadísticas de sucursales
 */
export const getSucursalesStats = async (): Promise<{
  success: boolean;
  message: string;
  data?: SucursalesStats;
}> => {
  try {
    const response = await api.get('/sucursales/stats');
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Crear una nueva sucursal
 */
export const createSucursal = async (
  data: SucursalFormData
): Promise<{
  success: boolean;
  message: string;
  data?: Sucursal;
}> => {
  try {
    const response = await api.post('/sucursales', data);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Actualizar una sucursal
 */
export const updateSucursal = async (
  id: number,
  data: Partial<SucursalFormData>
): Promise<{
  success: boolean;
  message: string;
  data?: Sucursal;
}> => {
  try {
    const response = await api.put(`/sucursales/${id}`, data);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Eliminar una sucursal
 */
export const deleteSucursal = async (id: number): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await api.delete(`/sucursales/${id}`);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener vendedores de una sucursal
 */
export const getVendedoresBySucursal = async (id: number, filters?: DateRangeFilter): Promise<{
  success: boolean;
  message: string;
  count?: number;
  data?: Array<{
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    numeroVentas: number;
    ventasTotales: number;
  }>;
}> => {
  try {
    const response = await api.get(`/sucursales/${id}/vendedores`, {
      params: filters
    });
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener detalle de un vendedor (KPIs + productos vendidos)
 */
export const getVendedorDetalle = async (
  id: number,
  filters?: DateRangeFilter
): Promise<{
  success: boolean;
  message: string;
  data?: VendedorDetalle;
}> => {
  try {
    const response = await api.get(`/dashboard/vendedores/${id}/detalle`, {
      params: filters
    });
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener inventario de una sucursal
 */
export const getInventarioBySucursal = async (id: number): Promise<{
  success: boolean;
  message: string;
  count?: number;
  data?: Array<{
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: string;
    stock: number;
  }>;
}> => {
  try {
    const response = await api.get(`/sucursales/${id}/inventario`);
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};
export default api;
