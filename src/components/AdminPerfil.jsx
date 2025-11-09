import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

/**
 * Componente para gestionar el perfil del administrador
 * Permite cambiar contraseña y ver información del usuario
 */
const AdminPerfil = () => {
	const { user, changePassword } = useAuth();
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [showPasswords, setShowPasswords] = useState({
		current: false,
		new: false,
		confirm: false,
	});
	const [loading, setLoading] = useState(false);
	const [alert, setAlert] = useState(null);

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		setAlert(null);

		// Validaciones
		if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
			setAlert({
				type: "error",
				message: "Todos los campos son obligatorios",
			});
			return;
		}

		if (passwordData.newPassword.length < 6) {
			setAlert({
				type: "error",
				message: "La nueva contraseña debe tener al menos 6 caracteres",
			});
			return;
		}

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			setAlert({
				type: "error",
				message: "Las contraseñas nuevas no coinciden",
			});
			return;
		}

		setLoading(true);

		try {
			const result = await changePassword(
				passwordData.currentPassword,
				passwordData.newPassword
			);

			if (result.success) {
				setAlert({
					type: "success",
					message: "Contraseña actualizada exitosamente",
				});
				setPasswordData({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
			} else {
				setAlert({
					type: "error",
					message: result.message || "Error al cambiar la contraseña",
				});
			}
		} catch (error) {
			setAlert({
				type: "error",
				message: error.message || "Error al cambiar la contraseña",
			});
		} finally {
			setLoading(false);
		}
	};

	const togglePasswordVisibility = (field) => {
		setShowPasswords(prev => ({
			...prev,
			[field]: !prev[field],
		}));
	};

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

			{/* Información del Usuario */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Información del Usuario</CardTitle>
					<CardDescription>Datos de tu cuenta administrativa</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label className="text-sm text-gray-600">Usuario</Label>
							<p className="font-medium">{user?.username || "N/A"}</p>
						</div>
						<div>
							<Label className="text-sm text-gray-600">Email</Label>
							<p className="font-medium">{user?.email || "N/A"}</p>
						</div>
						<div>
							<Label className="text-sm text-gray-600">Nombre</Label>
							<p className="font-medium">{user?.nombre || "N/A"}</p>
						</div>
						<div>
							<Label className="text-sm text-gray-600">Rol</Label>
							<p className="font-medium capitalize">
								{user?.rol === "superadmin" ? "Super Administrador" : "Administrador"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Cambiar Contraseña */}
			<Card>
				<CardHeader>
					<CardTitle>Cambiar Contraseña</CardTitle>
					<CardDescription>
						Actualiza tu contraseña de forma segura. Debe tener al menos 6 caracteres.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handlePasswordChange} className="space-y-4">
						{/* Contraseña Actual */}
						<div>
							<Label htmlFor="currentPassword">Contraseña Actual</Label>
							<div className="relative">
								<Input
									id="currentPassword"
									type={showPasswords.current ? "text" : "password"}
									value={passwordData.currentPassword}
									onChange={(e) =>
										setPasswordData({ ...passwordData, currentPassword: e.target.value })
									}
									className="pr-10"
									disabled={loading}
									placeholder="Ingresa tu contraseña actual"
								/>
								<button
									type="button"
									onClick={() => togglePasswordVisibility("current")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									tabIndex={-1}
								>
									{showPasswords.current ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						{/* Nueva Contraseña */}
						<div>
							<Label htmlFor="newPassword">Nueva Contraseña</Label>
							<div className="relative">
								<Input
									id="newPassword"
									type={showPasswords.new ? "text" : "password"}
									value={passwordData.newPassword}
									onChange={(e) =>
										setPasswordData({ ...passwordData, newPassword: e.target.value })
									}
									className="pr-10"
									disabled={loading}
									placeholder="Mínimo 6 caracteres"
								/>
								<button
									type="button"
									onClick={() => togglePasswordVisibility("new")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									tabIndex={-1}
								>
									{showPasswords.new ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						{/* Confirmar Nueva Contraseña */}
						<div>
							<Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									type={showPasswords.confirm ? "text" : "password"}
									value={passwordData.confirmPassword}
									onChange={(e) =>
										setPasswordData({ ...passwordData, confirmPassword: e.target.value })
									}
									className="pr-10"
									disabled={loading}
									placeholder="Repite la nueva contraseña"
								/>
								<button
									type="button"
									onClick={() => togglePasswordVisibility("confirm")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									tabIndex={-1}
								>
									{showPasswords.confirm ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						{/* Alert */}
						{alert && (
							<Alert variant={alert.type === "error" ? "destructive" : "default"}>
								{alert.type === "success" ? (
									<CheckCircle2 className="h-4 w-4" />
								) : (
									<AlertCircle className="h-4 w-4" />
								)}
								<AlertDescription>{alert.message}</AlertDescription>
							</Alert>
						)}

						{/* Botones */}
						<div className="flex gap-4">
							<Button type="submit" disabled={loading}>
								{loading ? "Actualizando..." : "Cambiar Contraseña"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setPasswordData({
										currentPassword: "",
										newPassword: "",
										confirmPassword: "",
									});
									setAlert(null);
								}}
								disabled={loading}
							>
								Cancelar
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default AdminPerfil;
