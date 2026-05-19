"use client";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">La Cafeta</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de gestión</p>
        </div>
        <p className="text-center text-sm text-gray-600 mb-6">Selecciona tu perfil</p>
        <div className="space-y-3">
          <a
            href="/api/auth/login-admin"
            className="block w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl text-center hover:bg-emerald-700"
          >
            Panel de Administración
          </a>
          <a
            href="/api/auth/login-employee"
            className="block w-full py-3 px-4 border-2 border-emerald-200 text-gray-800 font-semibold rounded-xl text-center hover:bg-emerald-50"
          >
            Portal de Empleado
          </a>
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">acceso sin contraseña — uso interno</p>
      </div>
    </div>
  );
}
