// proveedores.js - Gestión completa de proveedores

// Variables globales para proveedores
let currentProveedorId = null;

// Inicializar módulo de proveedores
document.addEventListener('DOMContentLoaded', () => {
    setupProveedoresEventListeners();
});

function setupProveedoresEventListeners() {
    const proveedorForm = document.getElementById('proveedorFormElement');
    if (proveedorForm) {
        proveedorForm.addEventListener('submit', handleProveedorSubmit);
    }
}

// Mostrar formulario de proveedores
function showProveedorForm(proveedor = null) {
    openManagementTab('proveedores');

    const form = document.getElementById('proveedorForm');
    const title = document.getElementById('proveedorFormTitle');

    if (form) {
        if (proveedor) {
            title.textContent = 'Editar Proveedor';
            currentProveedorId = proveedor.id;
            fillProveedorForm(proveedor);
        } else {
            title.textContent = 'Nuevo Proveedor';
            currentProveedorId = null;
            resetProveedorForm();
        }
        form.style.display = 'block';
    }
}

function resetProveedorForm() {
    const form = document.getElementById('proveedorFormElement');
    if (form) form.reset();
}

// Llenar formulario de proveedor
function fillProveedorForm(proveedor) {
    document.getElementById('proveedorId').value = proveedor.id;
    document.getElementById('proveedorNombre').value = proveedor.nombre || '';
    document.getElementById('proveedorRUC').value = proveedor.ruc || '';
    document.getElementById('proveedorTelefono').value = proveedor.telefono || '';
    document.getElementById('proveedorEmail').value = proveedor.email || '';
    document.getElementById('proveedorDireccion').value = proveedor.direccion || '';
    document.getElementById('proveedorContacto').value = proveedor.contacto || '';
}

// Ocultar formulario de proveedor
function hideProveedorForm() {
    const form = document.getElementById('proveedorForm');
    if (form) form.style.display = 'none';
    currentProveedorId = null;
}

// Manejar envío del formulario de proveedor
async function handleProveedorSubmit(e) {
    e.preventDefault();

    const proveedorData = {
        nombre: document.getElementById('proveedorNombre').value.trim(),
        ruc: document.getElementById('proveedorRUC').value.trim(),
        telefono: document.getElementById('proveedorTelefono').value.trim(),
        email: document.getElementById('proveedorEmail').value.trim(),
        direccion: document.getElementById('proveedorDireccion').value.trim(),
        contacto: document.getElementById('proveedorContacto').value.trim()
    };

    // Validaciones
    if (!proveedorData.nombre) {
        showMessage('El nombre del proveedor es obligatorio', 'error');
        return;
    }

    if (!proveedorData.ruc) {
        showMessage('El RUC del proveedor es obligatorio', 'error');
        return;
    }

    // Verificar RUC duplicado
    const proveedorExistente = await verificarRUCProveedorExistente(proveedorData.ruc, currentProveedorId);
    if (proveedorExistente) {
        const estado = proveedorExistente.estado ? 'activo' : 'inactivo';
        showMessage(`Ya existe un proveedor ${estado} con este RUC. ${!proveedorExistente.estado ? 'Puede activarlo desde la lista.' : ''}`, 'error');
        document.getElementById('proveedorRUC').focus();
        return;
    }

    try {
        const submitBtn = document.querySelector('#proveedorFormElement button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Guardando...';

        let response;
        const url = currentProveedorId
            ? `https://localhost:7000/api/proveedores/${currentProveedorId}`
            : 'https://localhost:7000/api/proveedores';

        const method = currentProveedorId ? 'PUT' : 'POST';

        response = await apiCall(url, {
            method: method,
            body: JSON.stringify(proveedorData)
        });

        showMessage('Proveedor guardado exitosamente', 'success');
        hideProveedorForm();
        loadProveedores();

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al guardar proveedor', 'error');
    } finally {
        const submitBtn = document.querySelector('#proveedorFormElement button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = currentProveedorId ? 'Actualizar Proveedor' : 'Guardar Proveedor';
        }
    }
}

// Función para verificar RUC duplicado
async function verificarRUCProveedorExistente(ruc, excludeId = null) {
    try {
        const proveedores = await apiCall('https://localhost:7000/api/proveedores');
        return proveedores.find(p =>
            p.ruc === ruc &&
            p.id !== excludeId
        );
    } catch (error) {
        console.error('Error verificando RUC:', error);
        return null;
    }
}

// Cargar proveedores
async function loadProveedores() {
    try {
        proveedores = await apiCall('https://localhost:7000/api/proveedores');
        renderProveedoresTable();
        updateProveedoresSelect();
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        showMessage('Error al cargar proveedores', 'error');
    }
}

// Renderizar tabla de proveedores
function renderProveedoresTable() {
    const tbody = document.getElementById('proveedoresTableBody');
    if (!tbody) return;

    if (!proveedores || proveedores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 20px; color: #6c757d;">
                    <i class="fas fa-truck" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No hay proveedores registrados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = proveedores.map(proveedor => `
        <tr>
            <td>${proveedor.nombre}</td>
            <td>${proveedor.ruc}</td>
            <td>${proveedor.telefono || '-'}</td>
            <td>${proveedor.email || '-'}</td>
            <td>${proveedor.contacto || '-'}</td>
            <td>
                <span class="badge ${proveedor.estado ? 'badge-success' : 'badge-danger'}">
                    ${proveedor.estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="showProveedorForm(${JSON.stringify(proveedor).replace(/"/g, '&quot;')})" 
                        title="Editar proveedor">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${proveedor.estado ? 'delete-btn' : 'activate-btn'}" 
                        onclick="${proveedor.estado ? 'desactivarProveedor' : 'activarProveedor'}(${proveedor.id})"
                        title="${proveedor.estado ? 'Desactivar proveedor' : 'Activar proveedor'}">
                    <i class="fas ${proveedor.estado ? 'fa-trash' : 'fa-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Desactivar proveedor
async function desactivarProveedor(id) {
    if (!confirm('¿Está seguro de desactivar este proveedor?')) return;

    try {
        await apiCall(`https://localhost:7000/api/proveedores/${id}`, {
            method: 'DELETE'
        });

        showMessage('Proveedor desactivado exitosamente', 'success');
        loadProveedores();
    } catch (error) {
        showMessage(error.message || 'Error al desactivar proveedor', 'error');
    }
}

// Activar proveedor
async function activarProveedor(id) {
    if (!confirm('¿Está seguro de activar este proveedor?')) return;

    try {
        await apiCall(`https://localhost:7000/api/proveedores/${id}/activate`, {
            method: 'PUT'
        });

        showMessage('Proveedor activado exitosamente', 'success');
        loadProveedores();
    } catch (error) {
        showMessage(error.message || 'Error al activar proveedor', 'error');
    }
}

// Actualizar select de proveedores en compras
function updateProveedoresSelect() {
    const selectProveedor = document.getElementById('compraProveedor');
    if (selectProveedor && proveedores) {
        const proveedoresActivos = proveedores.filter(p => p.estado);
        populateSelect(selectProveedor, proveedoresActivos, 'id', 'nombre', 'Seleccionar proveedor');
    }
}

// Buscar proveedor por RUC
async function buscarProveedorPorRUC(ruc) {
    if (!ruc) return null;

    try {
        const proveedores = await apiCall('https://localhost:7000/api/proveedores');
        return proveedores.find(p => p.ruc === ruc && p.estado);
    } catch (error) {
        return null;
    }
}