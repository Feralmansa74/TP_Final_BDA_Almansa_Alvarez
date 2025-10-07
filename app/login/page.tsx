import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif tracking-tight text-balance">Bienvenido de vuelta</h1>
          <p className="text-muted-foreground text-pretty">Ingresa tus credenciales para acceder a tu cuenta</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground hover:text-accent transition-colors underline underline-offset-4"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
