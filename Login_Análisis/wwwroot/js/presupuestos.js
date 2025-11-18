let presupuestos = [];
let presupuestoEditando = null;
let productosPresupuesto = []; // Nueva variable global para los productos del presupuesto

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

// === FUNCIONES DEL MODAL DINÁMICO ===

// Función para abrir modal de nuevo presupuesto (MODAL DINÁMICO)
function abrirModalNuevoPresupuesto() {
    console.log('Abriendo modal de presupuesto...');

    // Resetear variables
    productosPresupuesto = [];
    presupuestoEditando = null;

    // Crear modal dinámicamente (similar al de compras)
    const modalHTML = `
        <div id="modalPresupuesto" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000;">
            <div style="background:white; padding:30px; border-radius:10px; width:90%; max-width:900px; max-height:80vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3>Nuevo Presupuesto</h3>
                    <button onclick="cerrarModalPresupuesto()" style="background:none; border:none; font-size:20px; cursor:pointer;">×</button>
                </div>
                
                <form id="form-presupuesto" onsubmit="guardarPresupuesto(event)">
                    <!-- Información del Cliente -->
                    <div style="margin-bottom:20px;">
                        <h4>Información del Cliente</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">Cliente</label>
                                <select id="presupuesto-cliente" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;" onchange="cargarDatosCliente()">
                                    <option value="">Seleccionar cliente existente</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">O ingresar cliente nuevo</label>
                                <input type="text" id="presupuesto-nombre-cliente" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;" placeholder="Nombre del cliente">
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">NIT</label>
                                <input type="text" id="presupuesto-nit" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;" placeholder="NIT del cliente">
                            </div>
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">Dirección</label>
                                <input type="text" id="presupuesto-direccion" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;" placeholder="Dirección del cliente">
                            </div>
                        </div>
                    </div>

                    <!-- Fechas -->
                    <div style="margin-bottom:20px;">
                        <h4>Fechas</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">Fecha del Presupuesto</label>
                                <input type="date" id="presupuesto-fecha" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;" required>
                            </div>
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">Fecha de Vencimiento</label>
                                <input type="date" id="presupuesto-vencimiento" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;" required>
                            </div>
                        </div>
                    </div>

                    <!-- Productos -->
                    <div style="margin-bottom:20px;">
                        <h4>Productos</h4>
                        <div style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">Producto</label>
                                <select id="presupuesto-producto" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
                                    <option value="">Seleccionar producto</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">Cantidad</label>
                                <input type="number" id="presupuesto-cantidad" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;" value="1" min="1" step="0.01">
                            </div>
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">Precio Unitario</label>
                                <input type="number" id="presupuesto-precio" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;" min="0" step="0.01">
                            </div>
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">Descuento (%)</label>
                                <input type="number" id="presupuesto-descuento" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;" value="0" min="0" max="100" step="0.01">
                            </div>
                        </div>
                        <button type="button" onclick="agregarProductoPresupuesto()" style="background:#6c757d; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">
                            <i class="fas fa-plus"></i> Agregar Producto
                        </button>
                    </div>

                    <!-- Lista de Productos Agregados -->
                    <div style="margin-bottom:20px;">
                        <h4>Productos Agregados</h4>
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="background:#f8f9fa;">
                                        <th style="padding:10px; border:1px solid #ddd; text-align:left;">Producto</th>
                                        <th style="padding:10px; border:1px solid #ddd; text-align:center;">Cantidad</th>
                                        <th style="padding:10px; border:1px solid #ddd; text-align:right;">Precio Unit.</th>
                                        <th style="padding:10px; border:1px solid #ddd; text-align:center;">Descuento</th>
                                        <th style="padding:10px; border:1px solid #ddd; text-align:right;">Total</th>
                                        <th style="padding:10px; border:1px solid #ddd; text-align:center;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="lista-productos-presupuesto">
                                    <!-- Productos se agregarán aquí -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Totales -->
                    <div style="margin-bottom:20px; text-align:right;">
                        <div style="display:inline-block; text-align:left;">
                            <div style="margin-bottom:5px;">
                                <span style="font-weight:bold;">Subtotal:</span>
                                <span id="presupuesto-subtotal" style="margin-left:10px;">Q 0.00</span>
                            </div>
                            <div style="margin-bottom:5px;">
                                <span style="font-weight:bold;">IVA (12%):</span>
                                <span id="presupuesto-iva" style="margin-left:10px;">Q 0.00</span>
                            </div>
                            <div style="border-top:1px solid #ddd; padding-top:5px;">
                                <span style="font-weight:bold; font-size:1.1em;">TOTAL:</span>
                                <span id="presupuesto-total" style="margin-left:10px; font-weight:bold; font-size:1.1em;">Q 0.00</span>
                            </div>
                        </div>
                    </div>

                    <!-- Observaciones -->
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:5px; font-weight:bold;">Observaciones</label>
                        <textarea id="presupuesto-observaciones" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; height:80px;" placeholder="Observaciones adicionales..."></textarea>
                    </div>

                    <!-- Botones -->
                    <div style="display:flex; justify-content:flex-end; gap:10px;">
                        <button type="button" onclick="cerrarModalPresupuesto()" style="background:#6c757d; color:white; border:none; padding:10px 20px; border-radius:4px; cursor:pointer;">Cancelar</button>
                        <button type="submit" style="background:#007bff; color:white; border:none; padding:10px 20px; border-radius:4px; cursor:pointer;">Guardar Presupuesto</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Establecer fechas por defecto
    const hoy = new Date().toISOString().split('T')[0];
    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 15);
    const vencimientoStr = vencimiento.toISOString().split('T')[0];

    document.getElementById('presupuesto-fecha').value = hoy;
    document.getElementById('presupuesto-vencimiento').value = vencimientoStr;

    // Cargar datos
    cargarClientesPresupuesto();
    cargarProductosPresupuesto();
    actualizarListaProductosPresupuesto();
    calcularTotalesPresupuesto();
}

// Función para cerrar el modal
function cerrarModalPresupuesto() {
    const modal = document.getElementById('modalPresupuesto');
    if (modal) modal.remove();
}

// Cargar clientes en el select del modal
async function cargarClientesPresupuesto() {
    try {
        const response = await fetch('/api/Clientes/todos');
        if (response.ok) {
            const clientes = await response.json();
            const select = document.getElementById('presupuesto-cliente');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar cliente existente</option>';

                clientes.forEach(cliente => {
                    if (cliente.estado) {
                        const option = document.createElement('option');
                        option.value = cliente.id;
                        option.textContent = cliente.nombre + (cliente.nit ? ` (${cliente.nit})` : '');
                        select.appendChild(option);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        mostrarError('Error al cargar la lista de clientes');
    }
}

// Cargar productos en el select del modal
async function cargarProductosPresupuesto() {
    try {
        const response = await fetch('/api/Productos');
        if (response.ok) {
            const productos = await response.json();
            const select = document.getElementById('presupuesto-producto');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar producto</option>';

                productos.forEach(producto => {
                    const option = document.createElement('option');
                    option.value = producto.id;
                    option.textContent = `${producto.nombre} - Q${producto.precioVenta} - Stock: ${producto.stockActual}`;
                    option.setAttribute('data-precio', producto.precioVenta);
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarError('Error al cargar la lista de productos');
    }
}

// Cargar datos del cliente seleccionado
function cargarDatosCliente() {
    const clienteId = document.getElementById('presupuesto-cliente').value;
    const clientes = document.getElementById('presupuesto-cliente').options;

    if (clienteId) {
        const clienteSeleccionado = Array.from(clientes).find(opt => opt.value === clienteId);
        if (clienteSeleccionado) {
            const texto = clienteSeleccionado.textContent;
            const nombre = texto.split(' (')[0];
            document.getElementById('presupuesto-nombre-cliente').value = nombre;
        }
    }
}

// Agregar producto a la lista del presupuesto
function agregarProductoPresupuesto() {
    const productoSelect = document.getElementById('presupuesto-producto');
    const productoId = productoSelect.value;
    const productoTexto = productoSelect.options[productoSelect.selectedIndex].text;
    const productoNombre = productoTexto.split(' - ')[0];

    const cantidad = parseFloat(document.getElementById('presupuesto-cantidad').value) || 1;
    const precio = parseFloat(document.getElementById('presupuesto-precio').value) ||
        parseFloat(productoSelect.selectedOptions[0].getAttribute('data-precio')) || 0;
    const descuento = parseFloat(document.getElementById('presupuesto-descuento').value) || 0;

    // Validaciones
    if (!productoId) {
        mostrarError('Selecciona un producto');
        return;
    }

    if (cantidad <= 0) {
        mostrarError('La cantidad debe ser mayor a 0');
        return;
    }

    if (precio <= 0) {
        mostrarError('El precio debe ser mayor a 0');
        return;
    }

    // Calcular total con descuento
    const subtotalLinea = cantidad * precio;
    const descuentoMonto = subtotalLinea * (descuento / 100);
    const totalLinea = subtotalLinea - descuentoMonto;

    // Agregar producto al array
    const producto = {
        productoId: parseInt(productoId),
        productoNombre: productoNombre,
        cantidad: cantidad,
        precioUnitario: precio,
        descuentoAplicado: descuento,
        totalLinea: totalLinea
    };

    productosPresupuesto.push(producto);

    // Actualizar interfaz
    actualizarListaProductosPresupuesto();
    calcularTotalesPresupuesto();

    // Limpiar campos de producto
    productoSelect.value = '';
    document.getElementById('presupuesto-cantidad').value = 1;
    document.getElementById('presupuesto-precio').value = '';
    document.getElementById('presupuesto-descuento').value = 0;
}

// Actualizar la lista de productos en la tabla
function actualizarListaProductosPresupuesto() {
    const tbody = document.getElementById('lista-productos-presupuesto');
    if (!tbody) return;

    tbody.innerHTML = '';

    productosPresupuesto.forEach((producto, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:10px; border:1px solid #ddd;">${producto.productoNombre}</td>
            <td style="padding:10px; border:1px solid #ddd; text-align:center;">${producto.cantidad}</td>
            <td style="padding:10px; border:1px solid #ddd; text-align:right;">Q ${producto.precioUnitario.toFixed(2)}</td>
            <td style="padding:10px; border:1px solid #ddd; text-align:center;">${producto.descuentoAplicado}%</td>
            <td style="padding:10px; border:1px solid #ddd; text-align:right;">Q ${producto.totalLinea.toFixed(2)}</td>
            <td style="padding:10px; border:1px solid #ddd; text-align:center;">
                <button type="button" onclick="eliminarProductoPresupuesto(${index})" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Eliminar producto de la lista
function eliminarProductoPresupuesto(index) {
    productosPresupuesto.splice(index, 1);
    actualizarListaProductosPresupuesto();
    calcularTotalesPresupuesto();
}

// Calcular totales del presupuesto
function calcularTotalesPresupuesto() {
    const subtotal = productosPresupuesto.reduce((sum, producto) => sum + producto.totalLinea, 0);
    const iva = subtotal * 0.12; // 12% IVA
    const total = subtotal + iva;

    const subtotalElement = document.getElementById('presupuesto-subtotal');
    const ivaElement = document.getElementById('presupuesto-iva');
    const totalElement = document.getElementById('presupuesto-total');

    if (subtotalElement) subtotalElement.textContent = `Q ${subtotal.toFixed(2)}`;
    if (ivaElement) ivaElement.textContent = `Q ${iva.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `Q ${total.toFixed(2)}`;
}

// Guardar presupuesto
async function guardarPresupuesto(event) {
    event.preventDefault();

    // Validaciones básicas
    if (productosPresupuesto.length === 0) {
        mostrarError('Debe agregar al menos un producto al presupuesto');
        return;
    }

    const nombreCliente = document.getElementById('presupuesto-nombre-cliente').value;
    if (!nombreCliente) {
        mostrarError('El nombre del cliente es obligatorio');
        return;
    }

    // Preparar datos
    const presupuestoData = {
        fechaPresupuesto: document.getElementById('presupuesto-fecha').value,
        fechaVencimiento: document.getElementById('presupuesto-vencimiento').value,
        clienteId: document.getElementById('presupuesto-cliente').value || null,
        nombreCliente: nombreCliente,
        nitCliente: document.getElementById('presupuesto-nit').value,
        direccionCliente: document.getElementById('presupuesto-direccion').value,
        aplicarIVA: true,
        observaciones: document.getElementById('presupuesto-observaciones').value,
        detalles: productosPresupuesto.map(p => ({
            productoId: p.productoId,
            unidadMedidaId: 1, // Unidad por defecto
            cantidad: p.cantidad,
            precioUnitario: p.precioUnitario,
            descuentoAplicado: p.descuentoAplicado,
            observaciones: ''
        }))
    };

    try {
        const response = await fetch('/api/Presupuestos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obtenerToken()}`
            },
            body: JSON.stringify(presupuestoData)
        });

        if (response.ok) {
            const result = await response.json();
            mostrarExito('Presupuesto creado exitosamente');
            cerrarModalPresupuesto();
            cargarListaPresupuestos(); // Recargar la lista
        } else {
            const error = await response.json();
            mostrarError(error.message || 'Error al crear el presupuesto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al crear el presupuesto');
    }
}

// === FUNCIONES EXISTENTES (se mantienen igual) ===

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
