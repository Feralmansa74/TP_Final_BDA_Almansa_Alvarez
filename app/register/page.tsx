import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif tracking-tight text-balance">Crea tu cuenta</h1>
          <p className="text-muted-foreground text-pretty">Completa el formulario para comenzar tu experiencia</p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:text-accent transition-colors underline underline-offset-4"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
