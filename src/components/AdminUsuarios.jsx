import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "./ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
	CheckCircle2,
	AlertCircle,
	UserPlus,
	Edit,
	Trash2,
	Eye,
	EyeOff,
	Lock,
	Unlock,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";

/**
 * Componente para gestionar usuarios administradores
 * Solo accesible para superadmin
 */
const AdminUsuarios = () => {
	const { user, accessToken } = useAuth();
	const [usuarios, setUsuarios] = useState([]);
	const [loading, setLoading] = useState(true);
	const [alert, setAlert] = useState(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingUser, setEditingUser] = useState(null);
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		nombre: "",
		rol: "admin",
		activo: true,
	});

	// Cargar usuarios al montar
	useEffect(() => {
		cargarUsuarios();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const cargarUsuarios = async () => {
		try {
			const response = await fetch(`${API_URL}/api/auth/users`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!response.ok) {
				throw new Error("Error al cargar usuarios");
			}

			const data = await response.json();
			setUsuarios(data.users || []);
		} catch (error) {
			console.error("Error al cargar usuarios:", error);
			setAlert({
				type: "error",
				message: "Error al cargar la lista de usuarios",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleOpenDialog = (usuario = null) => {
		if (usuario) {
			setEditingUser(usuario);
			setFormData({
				username: usuario.username,
				email: usuario.email,
				password: "", // No mostrar contraseña actual
				nombre: usuario.nombre || "",
				rol: usuario.rol,
				activo: usuario.activo,
			});
		} else {
			setEditingUser(null);
			setFormData({
				username: "",
				email: "",
				password: "",
				nombre: "",
				rol: "admin",
				activo: true,
			});
		}
		setDialogOpen(true);
		setAlert(null);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingUser(null);
		setShowPassword(false);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setAlert(null);

		// Validaciones
		if (!formData.username || !formData.email) {
			setAlert({
				type: "error",
				message: "Usuario y email son obligatorios",
			});
			return;
		}

		if (!editingUser && !formData.password) {
			setAlert({
				type: "error",
				message: "La contraseña es obligatoria para nuevos usuarios",
			});
			return;
		}

		if (formData.password && formData.password.length < 6) {
			setAlert({
				type: "error",
				message: "La contraseña debe tener al menos 6 caracteres",
			});
			return;
		}

		setLoading(true);

		try {
			const url = editingUser
				? `${API_URL}/api/auth/users/${editingUser.id}`
				: `${API_URL}/api/auth/users`;

			const method = editingUser ? "PUT" : "POST";

			const body = editingUser
				? {
						// Al editar, solo enviar password si se cambió
						email: formData.email,
						nombre: formData.nombre,
						rol: formData.rol,
						activo: formData.activo,
						...(formData.password && { password: formData.password }),
				  }
				: formData;

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Error al guardar usuario");
			}

			setAlert({
				type: "success",
				message: editingUser
					? "Usuario actualizado exitosamente"
					: "Usuario creado exitosamente",
			});

			handleCloseDialog();
			cargarUsuarios();
		} catch (error) {
			console.error("Error al guardar usuario:", error);
			setAlert({
				type: "error",
				message: error.message || "Error al guardar usuario",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleToggleActive = async (usuario) => {
		if (usuario.id === user.id) {
			setAlert({
				type: "error",
				message: "No puedes desactivar tu propio usuario",
			});
			return;
		}

		try {
			const response = await fetch(`${API_URL}/api/auth/users/${usuario.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					activo: !usuario.activo,
				}),
			});

			if (!response.ok) {
				throw new Error("Error al cambiar estado del usuario");
			}

			setAlert({
				type: "success",
				message: `Usuario ${!usuario.activo ? "activado" : "desactivado"} exitosamente`,
			});

			cargarUsuarios();
		} catch (error) {
			console.error("Error al cambiar estado:", error);
			setAlert({
				type: "error",
				message: "Error al cambiar estado del usuario",
			});
		}
	};

	const handleDelete = async (usuario) => {
		if (usuario.id === user.id) {
			setAlert({
				type: "error",
				message: "No puedes eliminar tu propio usuario",
			});
			return;
		}

		if (!confirm(`¿Estás seguro de eliminar al usuario ${usuario.username}?`)) {
			return;
		}

		try {
			const response = await fetch(`${API_URL}/api/auth/users/${usuario.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!response.ok) {
				throw new Error("Error al eliminar usuario");
			}

			setAlert({
				type: "success",
				message: "Usuario eliminado exitosamente",
			});

			cargarUsuarios();
		} catch (error) {
			console.error("Error al eliminar:", error);
			setAlert({
				type: "error",
				message: "Error al eliminar usuario",
			});
		}
	};

	// Solo superadmin puede acceder
	if (user?.rol !== "superadmin") {
		return (
			<div className="container mx-auto p-6">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						No tienes permisos para acceder a esta sección. Solo los super administradores
						pueden gestionar usuarios.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
				<Button onClick={() => handleOpenDialog()}>
					<UserPlus className="mr-2 h-4 w-4" />
					Nuevo Usuario
				</Button>
			</div>

			{/* Alert */}
			{alert && (
				<Alert
					variant={alert.type === "error" ? "destructive" : "default"}
					className="mb-6"
				>
					{alert.type === "success" ? (
						<CheckCircle2 className="h-4 w-4" />
					) : (
						<AlertCircle className="h-4 w-4" />
					)}
					<AlertDescription>{alert.message}</AlertDescription>
				</Alert>
			)}

			{/* Tabla de Usuarios */}
			<Card>
				<CardHeader>
					<CardTitle>Usuarios Administradores</CardTitle>
					<CardDescription>
						Gestiona los usuarios con acceso al panel administrativo
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading && usuarios.length === 0 ? (
						<p className="text-center py-4">Cargando usuarios...</p>
					) : usuarios.length === 0 ? (
						<p className="text-center py-4 text-gray-500">No hay usuarios registrados</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Usuario</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Nombre</TableHead>
									<TableHead>Rol</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead className="text-right">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{usuarios.map((usuario) => (
									<TableRow key={usuario.id}>
										<TableCell className="font-medium">{usuario.username}</TableCell>
										<TableCell>{usuario.email}</TableCell>
										<TableCell>{usuario.nombre || "-"}</TableCell>
										<TableCell>
											<Badge variant={usuario.rol === "superadmin" ? "default" : "secondary"}>
												{usuario.rol === "superadmin" ? "Super Admin" : "Admin"}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={usuario.activo ? "success" : "destructive"}>
												{usuario.activo ? "Activo" : "Inactivo"}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													size="sm"
													variant="ghost"
													onClick={() => handleOpenDialog(usuario)}
													title="Editar usuario"
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => handleToggleActive(usuario)}
													title={usuario.activo ? "Desactivar" : "Activar"}
													disabled={usuario.id === user.id}
												>
													{usuario.activo ? (
														<Lock className="h-4 w-4" />
													) : (
														<Unlock className="h-4 w-4" />
													)}
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => handleDelete(usuario)}
													title="Eliminar usuario"
													disabled={usuario.id === user.id}
													className="text-red-600 hover:text-red-700"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Dialog para Crear/Editar Usuario */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editingUser ? "Editar Usuario" : "Nuevo Usuario"}
						</DialogTitle>
						<DialogDescription>
							{editingUser
								? "Modifica los datos del usuario. Deja la contraseña vacía si no deseas cambiarla."
								: "Completa los datos para crear un nuevo usuario administrador."}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Username */}
						<div>
							<Label htmlFor="username">Usuario *</Label>
							<Input
								id="username"
								value={formData.username}
								onChange={(e) => setFormData({ ...formData, username: e.target.value })}
								disabled={!!editingUser || loading}
								placeholder="Nombre de usuario"
							/>
						</div>

						{/* Email */}
						<div>
							<Label htmlFor="email">Email *</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								disabled={loading}
								placeholder="correo@ejemplo.com"
							/>
						</div>

						{/* Nombre */}
						<div>
							<Label htmlFor="nombre">Nombre Completo</Label>
							<Input
								id="nombre"
								value={formData.nombre}
								onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
								disabled={loading}
								placeholder="Nombre completo del usuario"
							/>
						</div>

						{/* Contraseña */}
						<div>
							<Label htmlFor="password">
								Contraseña {!editingUser && "*"} {editingUser && "(Opcional)"}
							</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={formData.password}
									onChange={(e) => setFormData({ ...formData, password: e.target.value })}
									disabled={loading}
									placeholder={
										editingUser
											? "Dejar vacío para no cambiar"
											: "Mínimo 6 caracteres"
									}
									className="pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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

						{/* Rol */}
						<div>
							<Label htmlFor="rol">Rol *</Label>
							<select
								id="rol"
								value={formData.rol}
								onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
								disabled={loading}
								className="w-full rounded-md border border-gray-300 px-3 py-2"
							>
								<option value="admin">Administrador</option>
								<option value="superadmin">Super Administrador</option>
							</select>
						</div>

						{/* Activo */}
						{editingUser && (
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="activo"
									checked={formData.activo}
									onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
									disabled={loading}
									className="rounded"
								/>
								<Label htmlFor="activo" className="cursor-pointer">
									Usuario activo
								</Label>
							</div>
						)}

						{/* Alert dentro del dialog */}
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

						<DialogFooter>
							<Button type="button" variant="outline" onClick={handleCloseDialog}>
								Cancelar
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? "Guardando..." : editingUser ? "Actualizar" : "Crear"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default AdminUsuarios;
