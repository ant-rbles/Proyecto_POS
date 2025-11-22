// membresias.js - Código corregido y funcional
document.addEventListener('DOMContentLoaded', function () {
    console.log('Inicializando módulo de membresías...');
    inicializarMembresias();

    // Cargar membresías después de un breve delay para asegurar que el token esté disponible
    setTimeout(() => {
        cargarMembresias();
    }, 500);
});

function inicializarMembresias() {
    console.log('Configurando event listeners de membresías...');

    // Configurar el formulario de membresía
    const formMembresia = document.getElementById('formMembresia');
    if (formMembresia) {
        formMembresia.addEventListener('submit', function (e) {
            e.preventDefault();
            guardarMembresia(e);
        });
    }

    // Configurar botón nueva membresía
    const btnNuevaMembresia = document.getElementById('btnNuevaMembresia');
    if (btnNuevaMembresia) {
        btnNuevaMembresia.addEventListener('click', mostrarFormularioMembresia);
    }

    // Configurar búsqueda de cliente
    const buscarClienteBtn = document.getElementById('buscarClienteBtn');
    if (buscarClienteBtn) {
        buscarClienteBtn.addEventListener('click', buscarClientePorNIT);
    }

    // Configurar fechas por defecto
    const fechaInicio = document.getElementById('FechaInicio');
    const fechaVencimiento = document.getElementById('FechaVencimiento');

    if (fechaInicio) {
        fechaInicio.value = new Date().toISOString().split('T')[0];
    }
    if (fechaVencimiento) {
        const fechaVenc = new Date();
        fechaVenc.setMonth(fechaVenc.getMonth() + 1);
        fechaVencimiento.value = fechaVenc.toISOString().split('T')[0];
    }

    // Configurar búsqueda en tiempo real
    const searchInput = document.getElementById('searchMembresias');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarMembresias);
    }

    // Configurar filtros
    const filterEstado = document.getElementById('filterEstado');
    const filterTipo = document.getElementById('filterTipo');
    if (filterEstado) filterEstado.addEventListener('change', filtrarMembresias);
    if (filterTipo) filterTipo.addEventListener('change', filtrarMembresias);
}

function mostrarErrorMembresia(mensaje) {
    const errorDiv = document.getElementById('membresiaError');
    const errorText = document.getElementById('membresiaErrorText');

    if (errorDiv && errorText) {
        errorText.textContent = mensaje;
        errorDiv.style.display = 'block';

        // Ocultar después de 5 segundos
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        console.error('Error en membresías:', mensaje);
        alert('Error: ' + mensaje);
    }
}

function obtenerToken() {
    const token =
        localStorage.getItem('authToken') ||  
        localStorage.getItem('token') ||      
        null;

    if (!token) {
        mostrarErrorMembresia('No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.');
        return null;
    }
    return token;
}


async function cargarMembresias() {
    console.log('Cargando membresías...');

    const token = obtenerToken();
    if (!token) return;

    try {
        // Mostrar loading
        const tbody = document.getElementById('membresiasTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-2 text-muted">Cargando membresías...</p>
                    </td>
                </tr>
            `;
        }

        const response = await fetch(`${API_BASE}/membresias`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });


        console.log('Respuesta del servidor:', response.status);

        if (response.status === 401) {
            mostrarErrorMembresia('No tiene permisos para acceder a las membresías. Contacte al administrador.');
            return;
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        const membresias = await response.json();
        console.log('Membresías cargadas:', membresias);
        mostrarMembresias(membresias);
        actualizarEstadisticas(membresias);

    } catch (error) {
        console.error('Error cargando membresías:', error);
        mostrarErrorMembresia('Error al cargar las membresías: ' + error.message);

        // Mostrar mensaje de error en la tabla
        const tbody = document.getElementById('membresiasTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-danger">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <p>Error al cargar las membresías</p>
                        <button class="btn btn-primary" onclick="cargarMembresias()">
                            <i class="fas fa-redo me-2"></i>Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

function mostrarMembresias(membresias) {
    const tbody = document.getElementById('membresiasTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!membresias || membresias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fas fa-id-card fa-3x mb-3"></i>
                        <p>No hay membresías registradas</p>
                        <button class="btn btn-primary" onclick="mostrarFormularioMembresia()">
                            <i class="fas fa-plus me-2"></i>Crear Primera Membresía
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    membresias.forEach(membresia => {
        const tr = document.createElement('tr');

        // Determinar clase según estado
        let estadoClass = '';
        let estadoText = '';

        switch (membresia.estado?.toUpperCase()) {
            case 'ACTIVA':
                estadoClass = 'badge bg-success';
                estadoText = 'Activa';
                break;
            case 'VENCIDA':
                estadoClass = 'badge bg-warning';
                estadoText = 'Vencida';
                break;
            case 'CANCELADA':
                estadoClass = 'badge bg-danger';
                estadoText = 'Cancelada';
                break;
            default:
                estadoClass = 'badge bg-secondary';
                estadoText = membresia.estado || 'Desconocido';
        }

        tr.innerHTML = `
            <td>${membresia.codigo || 'N/A'}</td>
            <td>${membresia.nombreCliente || 'N/A'}</td>
            <td>${membresia.tipo || 'N/A'}</td>
            <td>${membresia.fechaInicio ? new Date(membresia.fechaInicio).toLocaleDateString() : 'N/A'}</td>
            <td>${membresia.fechaVencimiento ? new Date(membresia.fechaVencimiento).toLocaleDateString() : 'N/A'}</td>
            <td><span class="${estadoClass}">${estadoText}</span></td>
            <td>Q ${membresia.montoPagado?.toFixed(2) || '0.00'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="editarMembresia(${membresia.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="cambiarEstadoMembresia(${membresia.id})" title="Cambiar Estado">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function actualizarEstadisticas(membresias) {
    if (!membresias) return;

    const total = membresias.length;
    const activas = membresias.filter(m => m.estado?.toUpperCase() === 'ACTIVA').length;
    const vencidas = membresias.filter(m => m.estado?.toUpperCase() === 'VENCIDA').length;

    // Calcular membresías por vencer (vencen en los próximos 7 días)
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);

    const porVencer = membresias.filter(m => {
        if (m.estado?.toUpperCase() !== 'ACTIVA') return false;
        if (!m.fechaVencimiento) return false;

        const fechaVencimiento = new Date(m.fechaVencimiento);
        return fechaVencimiento > hoy && fechaVencimiento <= en7Dias;
    }).length;

    // Actualizar UI
    const totalElement = document.getElementById('totalMembresias');
    const activasElement = document.getElementById('membresiasActivas');
    const porVencerElement = document.getElementById('membresiasPorVencer');
    const vencidasElement = document.getElementById('membresiasVencidas');

    if (totalElement) totalElement.textContent = total;
    if (activasElement) activasElement.textContent = activas;
    if (porVencerElement) porVencerElement.textContent = porVencer;
    if (vencidasElement) vencidasElement.textContent = vencidas;
}

function filtrarMembresias() {
    console.log('Filtrar membresías...');
    // Implementación básica de filtro - puedes mejorarla según necesites
    cargarMembresias();
}

function mostrarFormularioMembresia() {
    console.log('Mostrando formulario de membresía...');

    // Limpiar formulario
    const form = document.getElementById('formMembresia');
    if (form) {
        form.reset();
    }
    document.getElementById('membresiaId').value = '';
    document.getElementById('modalTitle').textContent = 'Nueva Membresía';

    // Establecer fechas por defecto
    const hoy = new Date();
    const vencimiento = new Date();
    vencimiento.setMonth(hoy.getMonth() + 1);

    document.getElementById('FechaInicio').value = hoy.toISOString().split('T')[0];
    document.getElementById('FechaVencimiento').value = vencimiento.toISOString().split('T')[0];

    // Mostrar modal
    const modalElement = document.getElementById('modalMembresia');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

async function buscarClientePorNIT() {
    const nit = document.getElementById('ClienteNIT').value.trim();
    if (!nit) {
        alert('Por favor ingrese un NIT');
        return;
    }

    const token = obtenerToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/clientes/buscar-por-nit/${nit}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const cliente = await response.json();
            document.getElementById('ClienteId').value = cliente.id;
            document.getElementById('NombreCliente').value = cliente.nombre;
            document.getElementById('TelefonoContacto').value = cliente.telefono || '';
        } else {
            document.getElementById('ClienteId').value = '';
            document.getElementById('NombreCliente').value = '';
            document.getElementById('TelefonoContacto').value = '';
            alert('Cliente no encontrado. Puede crear uno nuevo.');
        }
    } catch (error) {
        console.error('Error buscando cliente:', error);
        alert('Error al buscar cliente: ' + error.message);
    }
}

async function guardarMembresia(event) {
    event.preventDefault();
    console.log('Guardando membresía...');

    const token = obtenerToken();
    if (!token) return;

    const formData = new FormData(event.target);
    const membresiaId = document.getElementById('membresiaId').value;

    const membresiaData = {
        codigo: formData.get('Codigo'),
        nombreCliente: formData.get('NombreCliente'),
        clienteId: formData.get('ClienteId') || null,
        tipo: formData.get('Tipo'),
        fechaInicio: formData.get('FechaInicio'),
        fechaVencimiento: formData.get('FechaVencimiento'),
        montoPagado: parseFloat(formData.get('MontoPagado')) || 0,
        metodoPago: formData.get('MetodoPago'),
        telefonoContacto: formData.get('TelefonoContacto')
    };

    // Validaciones básicas
    if (!membresiaData.codigo || !membresiaData.nombreCliente || !membresiaData.tipo) {
        alert('Por favor complete todos los campos obligatorios (*)');
        return;
    }

    try {
        const url = '/api/membresias' + (membresiaId ? `/${membresiaId}` : '');
        const method = membresiaId ? 'PUT' : 'POST';

        // Mostrar loading en el botón
        const btnGuardar = document.getElementById('btnGuardarMembresia');
        const originalText = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';
        btnGuardar.disabled = true;

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(membresiaData)
        });

        // Restaurar botón
        btnGuardar.innerHTML = originalText;
        btnGuardar.disabled = false;

        if (response.status === 401) {
            mostrarErrorMembresia('No tiene permisos para realizar esta acción.');
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(errorData.message || `Error ${response.status}`);
        }

        const result = await response.json();
        alert(result.message || 'Membresía guardada correctamente');

        // Cerrar modal y recargar lista
        const modalElement = document.getElementById('modalMembresia');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
        }

        cargarMembresias();

    } catch (error) {
        console.error('Error guardando membresía:', error);
        alert('Error al guardar la membresía: ' + error.message);
    }
}

async function editarMembresia(id) {
    console.log('Editando membresía ID:', id);

    const token = obtenerToken();
    if (!token) return;

    try {
        const response = await fetch(`/api/membresias/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            mostrarErrorMembresia('No tiene permisos para editar membresías.');
            return;
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        const membresia = await response.json();

        // Llenar formulario con datos existentes
        document.getElementById('membresiaId').value = membresia.id;
        document.getElementById('Codigo').value = membresia.codigo || '';
        document.getElementById('NombreCliente').value = membresia.nombreCliente || '';
        document.getElementById('ClienteId').value = membresia.clienteId || '';
        document.getElementById('Tipo').value = membresia.tipo || '';
        document.getElementById('FechaInicio').value = membresia.fechaInicio ? new Date(membresia.fechaInicio).toISOString().split('T')[0] : '';
        document.getElementById('FechaVencimiento').value = membresia.fechaVencimiento ? new Date(membresia.fechaVencimiento).toISOString().split('T')[0] : '';
        document.getElementById('MontoPagado').value = membresia.montoPagado || 0;
        document.getElementById('MetodoPago').value = membresia.metodoPago || '';
        document.getElementById('TelefonoContacto').value = membresia.telefonoContacto || '';

        document.getElementById('modalTitle').textContent = 'Editar Membresía';

        // Mostrar modal
        const modalElement = document.getElementById('modalMembresia');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    } catch (error) {
        console.error('Error cargando membresía:', error);
        alert('Error al cargar la membresía: ' + error.message);
    }
}

async function cambiarEstadoMembresia(id) {
    const nuevoEstado = prompt('Ingrese el nuevo estado (ACTIVA, VENCIDA, CANCELADA):');

    if (nuevoEstado && ['ACTIVA', 'VENCIDA', 'CANCELADA'].includes(nuevoEstado.toUpperCase())) {
        const token = obtenerToken();
        if (!token) return;

        try {
            const response = await fetch(`/api/membresias/${id}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    estado: nuevoEstado.toUpperCase()
                })
            });

            if (response.status === 401) {
                mostrarErrorMembresia('No tiene permisos para cambiar el estado.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const result = await response.json();
            alert(result.message || 'Estado actualizado correctamente');
            cargarMembresias();
        } catch (error) {
            console.error('Error actualizando estado:', error);
            alert('Error al actualizar el estado: ' + error.message);
        }
    } else if (nuevoEstado !== null) {
        alert('Estado no válido. Use: ACTIVA, VENCIDA o CANCELADA');
    }
}

// Exportar funciones para uso global
window.mostrarFormularioMembresia = mostrarFormularioMembresia;
window.buscarClientePorNIT = buscarClientePorNIT;
window.guardarMembresia = guardarMembresia;
window.editarMembresia = editarMembresia;
window.cambiarEstadoMembresia = cambiarEstadoMembresia;
window.cargarMembresias = cargarMembresias;

console.log('Módulo de membresías cargado correctamente');