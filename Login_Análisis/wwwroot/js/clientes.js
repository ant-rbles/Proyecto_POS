window.clientes = window.clientes || [];
window.currentClienteId = window.currentClienteId || null;

async function loadClientes() {
    try {
        console.log('Cargando clientes...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/clientes/todos', { 
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            window.clientes = await response.json();
            console.log('Clientes cargados:', window.clientes.length);
            renderClientesTable();
        } else {
            const error = await response.json();
            showMessage('Error al cargar clientes: ' + error.message, 'error');
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
        showMessage('Error de conexión al cargar clientes', 'error');
    }
}

function showClienteForm(cliente = null) {
    console.log('Mostrando formulario de cliente');
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
            const clienteFormElement = document.getElementById('clienteFormElement');
            if (clienteFormElement) clienteFormElement.reset();
        }
        form.style.display = 'block';
    }
}


// Ocultar formulario
function hideClienteForm() {
    const form = document.getElementById('clienteForm');
    if (form) form.style.display = 'none';
    currentClienteId = null;
}

// Llenar formulario con datos
function fillClienteForm(cliente) {
    document.getElementById('clienteNombre').value = cliente.nombre || '';
    document.getElementById('clienteNIT').value = cliente.nit || '';
    document.getElementById('clienteTelefono').value = cliente.telefono || '';
    document.getElementById('clienteEmail').value = cliente.email || '';
    document.getElementById('clienteDireccion').value = cliente.direccion || '';
}

// Manejar envío del formulario
async function handleClienteSubmit(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Guardando...';

    const clienteData = {
        nombre: document.getElementById('clienteNombre').value.trim(),
        nit: document.getElementById('clienteNIT').value.trim(),
        direccion: document.getElementById('clienteDireccion').value.trim(),
        telefono: document.getElementById('clienteTelefono').value.trim(),
        email: document.getElementById('clienteEmail').value.trim()
    };

    // Validaciones básicas
    if (!clienteData.nombre || !clienteData.nit) {
        showMessage('Nombre y NIT son obligatorios', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Cliente';
        return;
    }

    try {
        const authToken = localStorage.getItem('authToken');
        let response;

        if (window.currentClienteId) {
            console.log('Actualizando cliente ID:', window.currentClienteId);
            response = await fetch(`https://localhost:7000/api/clientes/${window.currentClienteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(clienteData)
            });
        } else {
            console.log('Creando nuevo cliente');
            response = await fetch('https://localhost:7000/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(clienteData)
            });
        }

        if (response.ok) {
            const result = await response.json();
            showMessage('Cliente guardado exitosamente', 'success');
            hideClienteForm();
            await loadClientes();
        } else {
            const error = await response.json();

            // MEJORA: Si el error es por NIT duplicado, ofrecer buscar y editar
            if (error.message.includes('Ya existe un cliente con este NIT')) {
                showMessage('Ya existe un cliente con este NIT. ¿Quieres editarlo?', 'error');
                // Opcional: Aquí podrías agregar un botón para buscar automáticamente
                buscarYEditarCliente(clienteData.nit);
            } else {
                showMessage('Error al guardar cliente: ' + error.message, 'error');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Cliente';
    }
}

// Renderizar tabla de clientes
function renderClientesTable() {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;

    if (!window.clientes || window.clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No hay clientes registrados</td></tr>';
        return;
    }

    tbody.innerHTML = window.clientes.map(cliente => `
        <tr>
            <td>${cliente.nombre}</td>
            <td>${cliente.nit || 'N/A'}</td>
            <td>${cliente.telefono || '-'}</td>
            <td>${cliente.email || '-'}</td>
            <td>${cliente.direccion || '-'}</td>
            <td>
                <span class="badge ${cliente.estado ? 'badge-success' : 'badge-danger'}">
                    ${cliente.estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editCliente(${cliente.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${cliente.estado ? 'delete-btn' : 'activate-btn'}" 
                        onclick="${cliente.estado ? 'desactivarCliente' : 'activarCliente'}(${cliente.id})" 
                        title="${cliente.estado ? 'Desactivar' : 'Activar'}">
                    <i class="fas ${cliente.estado ? 'fa-times' : 'fa-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Editar cliente
async function editCliente(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/clientes/${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const cliente = await response.json();
            showClienteForm(cliente);
        } else {
            showMessage('Error al cargar el cliente', 'error');
        }
    } catch (err) {
        showMessage('Error de conexión', 'error');
    }
}

async function activarCliente(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/clientes/${id}/activate`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Cliente activado exitosamente', 'success');
            await loadClientes();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function desactivarCliente(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/clientes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Cliente desactivado exitosamente', 'success');
            await loadClientes();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}
