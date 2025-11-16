// api.js - Funciones para hacer solicitudes autenticadas
const API_BASE = 'https://localhost:7000/api';

// Función para hacer fetch con autenticación
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE}${url}`, mergedOptions);

        if (response.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            window.location.href = '/';
            return null;
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error en solicitud API:', error);
        return null;
    }
}

// Funciones específicas de API
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