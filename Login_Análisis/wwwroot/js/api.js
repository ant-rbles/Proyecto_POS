const API_BASE = 'https://localhost:7000/api';

// Función para hacer fetch con autenticación (soporta 'authToken' y 'token')
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || null;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(`${API_BASE}${url}`, mergedOptions);

        if (response.status === 401) {
            // Token inválido/expirado -> limpiar e indicar re-login
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // No redirecciono forzosamente para no romper flujos, pero devuelvo null
            console.warn('API returned 401 - token inválido o expirado');
            return null;
        }

        if (!response.ok) {
            // devolvemos el objeto Response para que el caller pueda leer status / json si lo desea
            const text = await response.text();
            throw new Error(`Error ${response.status}: ${text || response.statusText}`);
        }

        // Si no es contenido JSON (por ejemplo PDF), el caller debe manejarlo.
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) return await response.json();
        return response;
    } catch (error) {
        console.error('Error en solicitud API:', error);
        return null;
    }
}

// Funciones específicas de API (ejemplo)
async function apiLoadProductos() {
    return await fetchWithAuth('/productos');
}

async function apiLoadUnidadesMedida() {
    return await fetchWithAuth('/unidadesmedida');
}

async function apiLoadClientes() {
    return await fetchWithAuth('/clientes/todos');
}

async function apiLoadProveedores() {
    return await fetchWithAuth('/proveedores/todos');
}

async function apiLoadCategorias() {
    return await fetchWithAuth('/categorias');
}