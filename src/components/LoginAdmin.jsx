import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";

/**
 * Componente de Login para Panel Administrativo
 * Sistema de autenticación robusto con validaciones y seguridad mejorada
 */
function LoginAdmin() {
	const { login } = useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		// Validaciones básicas
		if (!username || !password) {
			setError("Usuario y contraseña son requeridos");
			return;
		}

		setLoading(true);

		try {
			const result = await login(username, password);

			if (!result.success) {
				setError(result.message || "Error al iniciar sesión");
			}
			// Si el login es exitoso, el AuthContext manejará la redirección
		} catch (error) {
			setError("Error al conectar con el servidor");
			console.error("Error en login:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-chocolate-50 via-white to-chocolate-50 p-4">
			<Card className="w-full max-w-md shadow-lg">
				<CardHeader className="space-y-1 text-center">
					<div className="flex justify-center mb-4">
						<div className="p-3 bg-chocolate-100 rounded-full">
							<Lock className="h-8 w-8 text-chocolate-600" />
						</div>
					</div>
					<CardTitle className="text-2xl font-bold">Panel Administrativo</CardTitle>
					<CardDescription>
						Transportes Araucaria - Sistema de Gestión
					</CardDescription>
				</CardHeader>

				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Label htmlFor="username">Usuario</Label>
							<div className="relative">
								<User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
								<Input
									id="username"
									type="text"
									placeholder="Ingrese su usuario"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className="pl-10"
									disabled={loading}
									autoComplete="username"
									autoFocus
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Contraseña</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="Ingrese su contraseña"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="pl-10 pr-10"
									disabled={loading}
									autoComplete="current-password"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
									tabIndex={-1}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						<div className="pt-2">
							<Button
								type="submit"
								className="w-full"
								disabled={loading}
							>
								{loading ? (
									<>
										<span className="animate-spin mr-2">⏳</span>
										Iniciando sesión...
									</>
								) : (
									"Iniciar Sesión"
								)}
							</Button>
						</div>
					</CardContent>
				</form>

				<CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-500">
					<p>Sistema protegido con autenticación JWT</p>
					<p className="text-xs">
						⚠️ Los intentos fallidos de acceso son registrados
					</p>
				</CardFooter>
			</Card>

			{/* Información de seguridad */}
			<div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md">
				<Card className="bg-chocolate-50 border-chocolate-200">
					<CardContent className="p-4 text-sm space-y-2">
						<h4 className="font-semibold text-chocolate-900 flex items-center gap-2">
							<Lock className="h-4 w-4" />
							Características de Seguridad
						</h4>
						<ul className="text-chocolate-800 space-y-1 text-xs">
							<li>✓ Contraseñas encriptadas con bcrypt</li>
							<li>✓ Tokens JWT con expiración (8 horas)</li>
							<li>✓ Bloqueo tras 5 intentos fallidos</li>
							<li>✓ Protección contra fuerza bruta</li>
							<li>✓ Logs de auditoría completos</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default LoginAdmin;
