"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { login, saveUser } from "@/lib/api"
import { Loader2, AlertCircle } from "lucide-react"

export function LoginForm() {
  // Estados para los campos del formulario
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  // Router para redirigir después del login
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    // Validación básica del frontend
    if (!usuario.trim() || !password.trim()) {
      setErrorMessage("Por favor completa todos los campos")
      setIsLoading(false)
      return
    }

    try {
      // Llamar a la API de login
      console.log("🔄 Intentando login con usuario:", usuario)
      const response = await login(usuario, password)

      if (response.success) {
        // Login exitoso
        console.log("✅ Login exitoso:", response.user)
        
        // Guardar datos del usuario en localStorage
        if (response.user) {
          saveUser(response.user)
        }

        // Redirigir al dashboard
        router.push("/dashboard")
      } else {
        // Login fallido
        console.log("❌ Login fallido:", response.message)
        setErrorMessage(response.message)
      }
    } catch (error) {
      console.error("❌ Error en login:", error)
      setErrorMessage("Ocurrió un error inesperado. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Mensaje de error */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          {/* Campo Usuario */}
          <div className="space-y-2">
            <Label htmlFor="usuario" className="text-sm font-medium">
              Usuario
            </Label>
            <Input
              id="usuario"
              type="text"
              placeholder="Ingresa tu usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="h-11"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <button 
                type="button" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => alert("Funcionalidad en desarrollo")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* Botón de Submit */}
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 rounded-md bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-700 font-semibold mb-1">
            🧪 Credenciales de prueba:
          </p>
          <div className="space-y-1">
            <p className="text-xs text-blue-600">
              <strong>Usuario:</strong> <code className="bg-blue-100 px-1 rounded">admin</code>
            </p>
            <p className="text-xs text-blue-600">
              <strong>Contraseña:</strong> <code className="bg-blue-100 px-1 rounded">admin123</code>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}