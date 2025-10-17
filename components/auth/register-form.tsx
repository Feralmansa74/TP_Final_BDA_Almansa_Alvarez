"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { register } from "@/lib/api"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export function RegisterForm() {
  // Estados del formulario
  const [formData, setFormData] = useState({
    usuario: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    // Validaciones del frontend
    if (!formData.usuario.trim() || !formData.email.trim() || !formData.password.trim()) {
      setErrorMessage("Por favor completa todos los campos")
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres")
      setIsLoading(false)
      return
    }

    if (!formData.acceptTerms) {
      setErrorMessage("Debes aceptar los términos y condiciones")
      setIsLoading(false)
      return
    }

    // Validar formato de email (básico)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("El formato del email no es válido")
      setIsLoading(false)
      return
    }

    try {
      // Llamar a la API de registro
      console.log("🔄 Intentando registrar usuario:", formData.usuario)
      const response = await register(
        formData.usuario,
        formData.password,
        formData.email
      )

      if (response.success) {
        // Registro exitoso
        console.log("✅ Registro exitoso:", response.user)
        setSuccessMessage("¡Cuenta creada exitosamente! Redirigiendo al login...")
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        // Registro fallido
        console.log("❌ Registro fallido:", response.message)
        setErrorMessage(response.message)
      }
    } catch (error) {
      console.error("❌ Error en registro:", error)
      setErrorMessage("Ocurrió un error inesperado. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpiar mensajes al escribir
    setErrorMessage("")
    setSuccessMessage("")
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

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
              Nombre de usuario
            </Label>
            <Input
              id="usuario"
              type="text"
              placeholder="juan_perez"
              value={formData.usuario}
              onChange={(e) => handleChange("usuario", e.target.value)}
              required
              className="h-11"
              disabled={isLoading}
              autoComplete="username"
            />
            <p className="text-xs text-muted-foreground">
              Sin espacios ni caracteres especiales
            </p>
          </div>

          {/* Campo Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              className="h-11"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
              className="h-11"
              disabled={isLoading}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
          </div>

          {/* Campo Confirmar Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              required
              className="h-11"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          {/* Checkbox Términos */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => handleChange("acceptTerms", checked as boolean)}
              required
              disabled={isLoading}
            />
            <label 
              htmlFor="terms" 
              className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
            >
              Acepto los{" "}
              <button
                type="button"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-2"
                onClick={() => alert("Términos y condiciones (en desarrollo)")}
              >
                términos y condiciones
              </button>{" "}
              y la{" "}
              <button
                type="button"
                className="text-foreground hover:text-accent transition-colors underline underline-offset-2"
                onClick={() => alert("Política de privacidad (en desarrollo)")}
              >
                política de privacidad
              </button>
            </label>
          </div>

          {/* Botón Submit */}
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}