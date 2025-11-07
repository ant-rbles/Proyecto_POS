async function loadClientes() {
    try {
        console.log('Cargando clientes...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/clientes', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            clientes = await response.json();
            console.log('Clientes cargados:', clientes);
            renderClientesTable();
        } else {
            console.error('Error al cargar clientes');
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

function renderClientesTable() {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;

    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No hay clientes registrados</td></tr>';
        return;
    }

    tbody.innerHTML = clientes.map(cliente => `
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
                <button class="action-btn edit-btn" onclick="editCliente(${cliente.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${cliente.estado ? 'delete-btn' : 'activate-btn'}" 
                        onclick="${cliente.estado ? 'deleteCliente' : 'activateCliente'}(${cliente.id})">
                    <i class="fas ${cliente.estado ? 'fa-trash' : 'fa-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

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
            document.getElementById('clienteFormElement').reset();
        }
        form.style.display = 'block';
    }
}

function hideClienteForm() {
    const form = document.getElementById('clienteForm');
    if (form) form.style.display = 'none';
    currentClienteId = null;
}

function fillClienteForm(cliente) {
    document.getElementById('clienteNombre').value = cliente.nombre;
    document.getElementById('clienteNIT').value = cliente.nit || '';
    document.getElementById('clienteTelefono').value = cliente.telefono || '';
    document.getElementById('clienteEmail').value = cliente.email || '';
    document.getElementById('clienteDireccion').value = cliente.direccion || '';
}

async function handleClienteSubmit(e) {
    e.preventDefault();

    const clienteData = {
        nombre: document.getElementById('clienteNombre').value.trim(),
        nit: document.getElementById('clienteNIT').value.trim(),
        telefono: document.getElementById('clienteTelefono').value.trim(),
        email: document.getElementById('clienteEmail').value.trim(),
        direccion: document.getElementById('clienteDireccion').value.trim()
    };

    try {
        const authToken = localStorage.getItem('authToken');
        let response;

        if (currentClienteId) {
            response = await fetch(`https://localhost:7000/api/clientes/${currentClienteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(clienteData)
            });
        } else {
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
            showMessage('Cliente guardado exitosamente', 'success');
            hideClienteForm();
            await loadClientes();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar cliente', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

async function deleteCliente(id) {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/clientes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Cliente eliminado exitosamente', 'success');
            await loadClientes();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function activateCliente(id) {
    // Para implementar cuando tengas el endpoint de activar cliente
    showMessage('Función de activar cliente no implementada', 'error');
}

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