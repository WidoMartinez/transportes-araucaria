import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import LoginAdmin from "./LoginAdmin";

/**
 * Componente de Ruta Protegida
 * Protege componentes que requieren autenticación
 */
function ProtectedRoute({ children }) {
	const { isAuthenticated, loading } = useAuth();

	// Mostrar loading mientras se verifica la autenticación
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Verificando autenticación...</p>
				</div>
			</div>
		);
	}

	// Si no está autenticado, mostrar pantalla de login
	if (!isAuthenticated) {
		return <LoginAdmin />;
	}

	// Si está autenticado, mostrar el contenido protegido
	return children;
}

export default ProtectedRoute;
