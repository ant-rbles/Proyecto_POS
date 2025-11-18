let presupuestos = [];
let presupuestoEditando = null;

// Cargar módulo de presupuestos
function cargarModuloPresupuestos() {
    cargarVista('presupuestos')
        .then(() => {
            cargarListaPresupuestos();
            cargarClientesParaPresupuesto();
            cargarProductosParaPresupuesto();
        });
}

// Cargar lista de presupuestos
async function cargarListaPresupuestos() {
    try {
        mostrarLoading();
        const response = await fetch('/api/presupuestos', {
            headers: {
                'Authorization': 'Bearer ' + obtenerToken()
            }
        });

        if (response.ok) {
            presupuestos = await response.json();
            renderizarTablaPresupuestos();
        } else {
            mostrarError('Error al cargar los presupuestos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    } finally {
        ocultarLoading();
    }
}

// Renderizar tabla de presupuestos
function renderizarTablaPresupuestos() {
    const tbody = document.getElementById('tabla-presupuestos');
    tbody.innerHTML = '';

    const filtroEstado = document.getElementById('filtro-estado').value;
    const filtroCliente = document.getElementById('filtro-cliente').value.toLowerCase();
    const filtroFechaDesde = document.getElementById('filtro-fecha-desde').value;
    const filtroFechaHasta = document.getElementById('filtro-fecha-hasta').value;

    const presupuestosFiltrados = presupuestos.filter(p => {
        const cumpleEstado = filtroEstado === 'TODOS' || p.estado === filtroEstado;
        const cumpleCliente = !filtroCliente || p.nombreCliente.toLowerCase().includes(filtroCliente);
        const cumpleFechaDesde = !filtroFechaDesde || new Date(p.fechaPresupuesto) >= new Date(filtroFechaDesde);
        const cumpleFechaHasta = !filtroFechaHasta || new Date(p.fechaPresupuesto) <= new Date(filtroFechaHasta);

        return cumpleEstado && cumpleCliente && cumpleFechaDesde && cumpleFechaHasta;
    });

    presupuestosFiltrados.forEach(presupuesto => {
        const tr = document.createElement('tr');

        // Determinar color del badge según estado
        let badgeClass = '';
        switch (presupuesto.estado) {
            case 'PENDIENTE': badgeClass = 'badge-warning'; break;
            case 'APROBADO': badgeClass = 'badge-success'; break;
            case 'RECHAZADO': badgeClass = 'badge-danger'; break;
            case 'VENCIDO': badgeClass = 'badge-secondary'; break;
            case 'CONVERTIDO': badgeClass = 'badge-info'; break;
        }

        // Determinar color de días restantes
        let diasClass = 'text-success';
        if (presupuesto.diasRestantes <= 3) diasClass = 'text-warning';
        if (presupuesto.diasRestantes <= 0) diasClass = 'text-danger';

        tr.innerHTML = `
            <td><strong>${presupuesto.numeroPresupuesto}</strong></td>
            <td>${presupuesto.nombreCliente || 'N/A'}</td>
            <td>${new Date(presupuesto.fechaPresupuesto).toLocaleDateString()}</td>
            <td>${new Date(presupuesto.fechaVencimiento).toLocaleDateString()}</td>
            <td><strong>Q ${presupuesto.total.toFixed(2)}</strong></td>
            <td><span class="badge ${badgeClass}">${presupuesto.estado}</span></td>
            <td><span class="${diasClass}"><strong>${presupuesto.diasRestantes}</strong> días</span></td>
            <td>
                <button class="btn btn-info btn-sm" onclick="verPresupuesto(${presupuesto.id})" title="Ver">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="descargarPDF(${presupuesto.id})" title="Descargar PDF">
                    <i class="fas fa-download"></i>
                </button>
                ${presupuesto.estado === 'PENDIENTE' ? `
                <button class="btn btn-warning btn-sm" onclick="editarPresupuesto(${presupuesto.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-success btn-sm" onclick="cambiarEstadoPresupuesto(${presupuesto.id}, 'APROBADO')" title="Aprobar">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="cambiarEstadoPresupuesto(${presupuesto.id}, 'RECHAZADO')" title="Rechazar">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
                ${(presupuesto.estado === 'APROBADO' && (usuarioActual.rol === 'Administrador' || usuarioActual.rol === 'Cajero')) ? `
                <button class="btn btn-primary btn-sm" onclick="convertirEnVenta(${presupuesto.id})" title="Convertir en Venta">
                    <i class="fas fa-cash-register"></i>
                </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filtrar presupuestos
function filtrarPresupuestos() {
    renderizarTablaPresupuestos();
}

// Abrir modal para nuevo presupuesto
function abrirModalNuevoPresupuesto() {
    presupuestoEditando = null;
    document.getElementById('modal-presupuesto-titulo').textContent = 'Nuevo Presupuesto';
    document.getElementById('form-presupuesto').reset();
    document.getElementById('lista-productos-presupuesto').innerHTML = '';
    calcularTotalPresupuesto();

    // Mostrar modal
    $('#modalPresupuesto').modal('show');
}

// Ver detalle de presupuesto
async function verPresupuesto(id) {
    try {
        const response = await fetch(`/api/presupuestos/${id}`, {
            headers: {
                'Authorization': 'Bearer ' + obtenerToken()
            }
        });

        if (response.ok) {
            const presupuesto = await response.json();
            mostrarDetallePresupuesto(presupuesto);
        } else {
            mostrarError('Error al cargar el presupuesto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Descargar PDF
async function descargarPDF(id) {
    try {
        const response = await fetch(`/api/presupuestos/${id}/pdf`, {
            headers: {
                'Authorization': 'Bearer ' + obtenerToken()
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Presupuesto_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            mostrarError('Error al descargar el PDF');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Convertir presupuesto en venta
async function convertirEnVenta(id) {
    if (!confirm('¿Está seguro de convertir este presupuesto en una venta? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/presupuestos/${id}/convertir-venta`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + obtenerToken()
            }
        });

        if (response.ok) {
            const result = await response.json();
            mostrarExito(result.message);
            cargarListaPresupuestos();

            // Opcional: redirigir a la venta creada
            if (result.ventaId) {
                setTimeout(() => {
                    // Aquí puedes redirigir al módulo de ventas si quieres
                    console.log('Venta creada con ID:', result.ventaId);
                }, 2000);
            }
        } else {
            const error = await response.json();
            mostrarError(error.message || 'Error al convertir en venta');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}