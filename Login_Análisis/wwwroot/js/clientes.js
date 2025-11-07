// clientes.js - Gestión completa de clientes

// Variables globales para clientes
let currentClienteId = null;

// Inicializar módulo de clientes
document.addEventListener('DOMContentLoaded', () => {
    setupClientesEventListeners();
});

function setupClientesEventListeners() {
    const clienteForm = document.getElementById('clienteFormElement');
    if (clienteForm) {
        clienteForm.addEventListener('submit', handleClienteSubmit);
    }
}

// Mostrar formulario de clientes
function showClienteForm(cliente = null) {
    openManagementTab('clientes');

    const form = document.getElementById('clienteForm');
    const title = document.getElementById('clienteFormTitle');

    if (form) {
        if (cliente) {
            title.textContent = 'Editar Cliente';
            currentClienteId = cliente.id;
            fillClienteForm(cliente);
        } else {
            title.textContent = 'Nuevo Cliente';
            currentClienteId = null;
            resetClienteForm();
        }
        form.style.display = 'block';
    }
}

function resetClienteForm() {
    const form = document.getElementById('clienteFormElement');
    if (form) form.reset();
}

// Llenar formulario de cliente
function fillClienteForm(cliente) {
    document.getElementById('clienteId').value = cliente.id;
    document.getElementById('clienteNombre').value = cliente.nombre || '';
    document.getElementById('clienteNIT').value = cliente.nit || '';
    document.getElementById('clienteDireccion').value = cliente.direccion || '';
    document.getElementById('clienteTelefono').value = cliente.telefono || '';
    document.getElementById('clienteEmail').value = cliente.email || '';
}

// Ocultar formulario de cliente
function hideClienteForm() {
    const form = document.getElementById('clienteForm');
    if (form) form.style.display = 'none';
    currentClienteId = null;
}

// Manejar envío del formulario de cliente
async function handleClienteSubmit(e) {
    e.preventDefault();

    const clienteData = {
        nombre: document.getElementById('clienteNombre').value.trim(),
        nit: document.getElementById('clienteNIT').value.trim(),
        direccion: document.getElementById('clienteDireccion').value.trim(),
        telefono: document.getElementById('clienteTelefono').value.trim(),
        email: document.getElementById('clienteEmail').value.trim()
    };

    // Validaciones
    if (!clienteData.nombre) {
        showMessage('El nombre del cliente es obligatorio', 'error');
        return;
    }

    try {
        const submitBtn = document.querySelector('#clienteFormElement button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Guardando...';

        let response;
        const url = currentClienteId
            ? `https://localhost:7000/api/clientes/${currentClienteId}`
            : 'https://localhost:7000/api/clientes';

        const method = currentClienteId ? 'PUT' : 'POST';

        response = await apiCall(url, {
            method: method,
            body: JSON.stringify(clienteData)
        });

        showMessage('Cliente guardado exitosamente', 'success');
        hideClienteForm();
        loadClientes();

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al guardar cliente', 'error');
    } finally {
        const submitBtn = document.querySelector('#clienteFormElement button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = currentClienteId ? 'Actualizar Cliente' : 'Guardar Cliente';
        }
    }
}

// Cargar clientes
async function loadClientes() {
    try {
        clientes = await apiCall('https://localhost:7000/api/clientes');
        renderClientesTable();
        updateClientesVentaSelect();
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        showMessage('Error al cargar clientes', 'error');
    }
}

// Renderizar tabla de clientes
function renderClientesTable() {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;

    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 20px; color: #6c757d;">
                    <i class="fas fa-users" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No hay clientes registrados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clientes.map(cliente => `
        <tr>
            <td>${cliente.nombre}</td>
            <td>${cliente.nit || '-'}</td>
            <td>${cliente.direccion || '-'}</td>
            <td>${cliente.telefono || '-'}</td>
            <td>${cliente.email || '-'}</td>
            <td>
                <span class="badge ${cliente.estado ? 'badge-success' : 'badge-danger'}">
                    ${cliente.estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="showClienteForm(${JSON.stringify(cliente).replace(/"/g, '&quot;')})" 
                        title="Editar cliente">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${cliente.estado ? 'delete-btn' : 'activate-btn'}" 
                        onclick="${cliente.estado ? 'desactivarCliente' : 'activarCliente'}(${cliente.id})"
                        title="${cliente.estado ? 'Desactivar cliente' : 'Activar cliente'}">
                    <i class="fas ${cliente.estado ? 'fa-trash' : 'fa-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Desactivar cliente
async function desactivarCliente(id) {
    if (!confirm('¿Está seguro de desactivar este cliente?')) return;

    try {
        await apiCall(`https://localhost:7000/api/clientes/${id}`, {
            method: 'DELETE'
        });

        showMessage('Cliente desactivado exitosamente', 'success');
        loadClientes();
    } catch (error) {
        showMessage(error.message || 'Error al desactivar cliente', 'error');
    }
}

// Activar cliente
async function activarCliente(id) {
    if (!confirm('¿Está seguro de activar este cliente?')) return;

    try {
        await apiCall(`https://localhost:7000/api/clientes/${id}/activate`, {
            method: 'PUT'
        });

        showMessage('Cliente activado exitosamente', 'success');
        loadClientes();
    } catch (error) {
        showMessage(error.message || 'Error al activar cliente', 'error');
    }
}

// Actualizar select de clientes en ventas
function updateClientesVentaSelect() {
    const selectCliente = document.getElementById('ventaCliente');
    if (selectCliente && clientes) {
        const clientesActivos = clientes.filter(c => c.estado);
        populateSelect(selectCliente, clientesActivos, 'id', 'nombre', 'Seleccionar cliente');
    }
}

// Buscar cliente por NIT
async function buscarClientePorNIT(nit) {
    if (!nit) return null;

    try {
        const response = await apiCall(`https://localhost:7000/api/clientes/buscar-por-nit/${encodeURIComponent(nit)}`);
        return response;
    } catch (error) {
        return null;
    }
}