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

export interface ApiResponse {
  success: boolean;
  message: string;
  user?: User;
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
  stats?: {
    totalUsuarios: number;
    nuevosUltimaSemana: number;
    nuevosUltimoMes: number;
  };
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
export const getRankingSucursales = async (): Promise<{
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
    const response = await api.get('/dashboard/sucursales/ranking');
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener ventas por categoría
 */
export const getVentasPorCategoria = async (): Promise<{
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
    const response = await api.get('/dashboard/categorias');
    return response.data;
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Obtener top productos
 */
export const getTopProductos = async (limit: number = 10): Promise<{
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
    const response = await api.get(`/dashboard/productos/top?limit=${limit}`);
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

export default api;