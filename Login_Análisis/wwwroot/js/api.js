const API_BASE = 'https://localhost:7000/api';

// Función para hacer fetch con autenticación (soporta 'authToken' y 'token')
async function fetchWithAuth(url, options = {}) {
    const token =
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        null;

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
            console.warn('API returned 401 - token inválido o expirado (no se borra token automáticamente).');
            return response;
        }

        if (!response.ok) {
            // devolvemos el objeto Response para que el caller pueda leer status / json si lo desea
            const text = await response.text();
            throw new Error(`Error ${response.status}: ${text || response.statusText}`);
        }

        // Si el contenido no es JSON (por ejemplo un PDF), se devuelve tal cual
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await response.json();
        }

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
