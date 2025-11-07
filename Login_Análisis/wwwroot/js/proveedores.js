function showProveedorForm(proveedor = null) {
    console.log('Mostrando formulario de proveedor');
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
            const proveedorFormElement = document.getElementById('proveedorFormElement');
            if (proveedorFormElement) proveedorFormElement.reset();
        }
        form.style.display = 'block';
    } else {
        console.error('No se encontró el formulario de proveedor');
    }
}

function hideProveedorForm() {
    const form = document.getElementById('proveedorForm');
    if (form) form.style.display = 'none';
    currentProveedorId = null;
}

function fillProveedorForm(proveedor) {
    document.getElementById('proveedorId').value = proveedor.id;
    document.getElementById('proveedorNombre').value = proveedor.nombre;
    document.getElementById('proveedorRUC').value = proveedor.ruc;
    document.getElementById('proveedorTelefono').value = proveedor.telefono || '';
    document.getElementById('proveedorEmail').value = proveedor.email || '';
    document.getElementById('proveedorDireccion').value = proveedor.direccion || '';
    document.getElementById('proveedorContacto').value = proveedor.contacto || '';
}

async function handleProveedorSubmit(e) {
    e.preventDefault();
    console.log('Enviando formulario de proveedor');

    const proveedor = {
        nombre: document.getElementById('proveedorNombre').value,
        ruc: document.getElementById('proveedorRUC').value,
        telefono: document.getElementById('proveedorTelefono').value,
        email: document.getElementById('proveedorEmail').value,
        direccion: document.getElementById('proveedorDireccion').value,
        contacto: document.getElementById('proveedorContacto').value
    };

    // Validar RUC duplicado
    const proveedorExistente = await verificarRUCProveedorExistente(proveedor.ruc, currentProveedorId);
    if (proveedorExistente) {
        const estado = proveedorExistente.estado ? 'activo' : 'inactivo';
        showMessage(`Ya existe un proveedor ${estado} con este RUC. ${!proveedorExistente.estado ? 'Puede activarlo desde la lista.' : ''}`, 'error');
        document.getElementById('proveedorRUC').focus();
        return;
    }

    try {
        const authToken = localStorage.getItem('authToken');
        let response;

        if (currentProveedorId) {
            response = await fetch(`https://localhost:7000/api/proveedores/${currentProveedorId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(proveedor)
            });
        } else {
            response = await fetch('https://localhost:7000/api/proveedores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(proveedor)
            });
        }

        if (response.ok) {
            showMessage('Proveedor guardado exitosamente', 'success');
            hideProveedorForm();
            loadProveedores();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar proveedor', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

async function loadProveedores() {
    try {
        console.log(' INICIANDO CARGA DE PROVEEDORES ');
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            showMessage('No hay sesión activa', 'error');
            return;
        }

        let proveedoresData = [];
        let usandoEndpointTodos = false;

        // PRIMERO intentar con el endpoint /todos
        try {
            console.log('Intentando endpoint /api/proveedores/todos...');
            const responseTodos = await fetch('https://localhost:7000/api/proveedores/todos', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (responseTodos.ok) {
                proveedoresData = await responseTodos.json();
                usandoEndpointTodos = true;
                console.log('Éxito con endpoint /todos. Proveedores cargados:', proveedoresData.length);
            } else {
                console.log('Endpoint /todos falló, intentando endpoint normal...');
                throw new Error(`Status: ${responseTodos.status}`);
            }
        } catch (error) {
            // Si falla /todos, intentar con endpoint normal
            console.log('Intentando endpoint normal /api/proveedores...');
            const responseNormal = await fetch('https://localhost:7000/api/proveedores', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (responseNormal.ok) {
                proveedoresData = await responseNormal.json();
                console.log('Éxito con endpoint normal. Proveedores cargados:', proveedoresData.length);
                console.warn('Solo se cargan proveedores activos. Los proveedores inactivos no están disponibles.');
            } else {
                throw new Error(`Error ${responseNormal.status}: ${responseNormal.statusText}`);
            }
        }

        // Procesar los datos
        proveedores = proveedoresData;

        // Mostrar estadísticas
        const activos = proveedores.filter(p => p.estado === true).length;
        const inactivos = proveedores.filter(p => p.estado === false).length;

        console.log(`Resumen: ${activos} activos, ${inactivos} inactivos, Total: ${proveedores.length}`);

        if (usandoEndpointTodos && inactivos === 0 && proveedores.length > 0) {
            console.warn('El endpoint /todos se usó pero no se encontraron proveedores inactivos. Posible problema en el backend.');
        }

        // Renderizar tabla
        renderProveedoresTable();

        // Actualizar select de compras (solo proveedores activos)
        updateProveedoresSelect();

    } catch (error) {
        console.error('Error crítico en loadProveedores:', error);
        showMessage('Error al cargar los proveedores: ' + error.message, 'error');
    }
}

// Actualizar la función updateProveedoresSelect para filtrar solo activos
function updateProveedoresSelect() {
    console.log('Actualizando select de proveedores para COMPRAS...');

    try {
        const selectProveedor = document.getElementById('compraProveedor');
        if (selectProveedor && proveedores) {
            // SOLO proveedores activos para compras
            const proveedoresActivos = proveedores.filter(p => {
                const estado = p.estado !== undefined ? p.estado : true;
                return estado;
            });

            selectProveedor.innerHTML = '<option value="">Seleccionar proveedor</option>' +
                proveedoresActivos.map(p =>
                    `<option value="${p.id}">${p.nombre}</option>`
                ).join('');
            console.log('Select de proveedores actualizado para compras:', proveedoresActivos.length, 'proveedores activos');
        }
    } catch (error) {
        console.error('Error en updateProveedoresSelect:', error);
    }
}

// Función para verificar RUC duplicado 
async function verificarRUCProveedorExistente(ruc, excludeId = null) {
    try {
        const authToken = localStorage.getItem('authToken');
        // Usar el endpoint /todos para verificar contra todos los proveedores
        let response = await fetch('https://localhost:7000/api/proveedores/todos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        // Si falla /todos, usar endpoint normal
        if (!response.ok) {
            response = await fetch('https://localhost:7000/api/proveedores', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }

        if (response.ok) {
            const proveedores = await response.json();
            return proveedores.find(p =>
                p.ruc === ruc &&
                p.id !== excludeId
            );
        }
        return null;
    } catch (error) {
        console.error('Error verificando RUC:', error);
        return null;
    }
}

// Renderizar tabla de proveedores mostrando estado
function renderProveedoresTable() {
    const tbody = document.getElementById('proveedoresTableBody');
    if (!tbody) {
        console.error('No se encontró proveedoresTableBody');
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
                <button class="action-btn edit-btn" onclick="showProveedorForm(${JSON.stringify(proveedor).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${proveedor.estado ? 'delete-btn' : 'activate-btn'}" 
                        onclick="${proveedor.estado ? 'deleteProveedor' : 'activateProveedor'}(${proveedor.id})">
                    <i class="fas ${proveedor.estado ? 'fa-trash' : 'fa-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para activar proveedor
async function activateProveedor(id) {
    if (!confirm('¿Está seguro de que desea activar este proveedor?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/proveedores/${id}/activate`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Proveedor activado exitosamente', 'success');
            loadProveedores();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function deleteProveedor(id) {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/proveedores/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Proveedor eliminado exitosamente', 'success');
            loadProveedores();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}