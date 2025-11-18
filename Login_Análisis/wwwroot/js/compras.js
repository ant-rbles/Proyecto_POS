window.detallesCompra = window.detallesCompra || [];
window.unidadesMedida = window.unidadesMedida || [];
window.productos = window.productos || [];

// Mostrar formulario de compra
function showCompraForm() {
    openManagementTab('compras');

    const form = document.getElementById('compraForm');
    if (form) {
        form.style.display = 'block';
        document.getElementById('compraFecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('compraFactura').value = '';
        document.getElementById('compraFactura').placeholder = 'Se generará automáticamente';

        // Reiniciar detalles
        detallesCompra = [];
        renderDetallesTable();
        calcularTotalesCompra();

        // Cargar selects locales (si existen)
        if (typeof updateProveedoresSelect === 'function') updateProveedoresSelect();
        if (typeof updateProductosSelects === 'function') updateProductosSelects();
        cargarUnidades();
    } else {
        console.error('No se encontró el formulario de compra');
    }
}

function cargarUnidades() {
    fetch('/api/unidadesmedida')
        .then(res => res.json())
        .then(unidades => {
            unidadesMedida = unidades;
            const select = document.getElementById("detalleUnidad");
            if (!select) return;
            select.innerHTML = '<option value="">Seleccionar unidad</option>';
            unidades.forEach(u => {
                select.innerHTML += `<option value="${u.id}" data-factor="${u.factorConversion}">${u.nombre} (${u.factorConversion})</option>`;
            });
        })
        .catch(err => console.error('Error cargando unidades:', err));
}

function cargarCompras() {
    fetch('/api/compras', { headers: (localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) })
        .then(res => {
            if (!res.ok) throw new Error('Error al obtener compras');
            return res.json();
        })
        .then(data => {
            mostrarComprasEnTabla(data);
            console.log("Compras cargadas:", data);
        })
        .catch(error => {
            console.error('Error al cargar compras:', error);
            showMessage ? showMessage('Error al cargar compras', 'error') : null;
        });
}

function hideCompraForm() {
    const form = document.getElementById('compraForm');
    if (form) form.style.display = 'none';
    const compraFormElement = document.getElementById('compraFormElement');
    if (compraFormElement) compraFormElement.reset();
    detallesCompra = [];
}

// Función mejorada para agregar detalle a compra
function agregarDetalle() {
    const productoId = parseInt(document.getElementById('detalleProducto')?.value);
    const unidadId = parseInt(document.getElementById('detalleUnidad')?.value);
    const cantidad = parseFloat(document.getElementById('detalleCantidad')?.value) || 0;
    const precio = parseFloat(document.getElementById('detallePrecio')?.value) || 0;

    // Validaciones
    if (!productoId || isNaN(productoId)) {
        showMessage('Seleccione un producto válido', 'error');
        return;
    }
    if (!unidadId || isNaN(unidadId)) {
        showMessage('Seleccione una unidad de medida válida', 'error');
        return;
    }
    if (cantidad <= 0) {
        showMessage('La cantidad debe ser mayor a 0', 'error');
        return;
    }
    if (precio <= 0) {
        showMessage('El precio unitario debe ser mayor a 0', 'error');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    const unidad = unidadesMedida.find(u => u.id === unidadId);

    if (!producto || !unidad) {
        showMessage('Error al obtener información del producto o unidad', 'error');
        return;
    }

    const factor = unidad.factorConversion; 

    const cantidadBase = cantidad * factor;
    const precioUnitarioBase = precio / factor;
    const totalLinea = cantidadBase * precioUnitarioBase;

    const detalle = {
        productoId: productoId,
        unidadMedidaId: unidadId,
        cantidad: cantidadBase, 
        precioUnitario: precioUnitarioBase, 
        totalLinea: totalLinea,
        producto: producto,
        unidad: unidad
    };

    detallesCompra.push(detalle);
    renderDetallesTable();
    calcularTotalesCompra();

    // Limpiar campos
    document.getElementById('detalleCantidad').value = '1';
    document.getElementById('detallePrecio').value = '0';
    document.getElementById('detalleTotal').value = '0';
    document.getElementById('detalleProducto').selectedIndex = 0;
    document.getElementById('detalleUnidad').selectedIndex = 0;
}

function eliminarDetalle(index) {
    detallesCompra.splice(index, 1);
    renderDetallesTable();
    calcularTotalesCompra();
}

function renderDetallesTable() {
    const tbody = document.getElementById('detallesTableBody');
    if (!tbody) return;

    tbody.innerHTML = detallesCompra.map((detalle, index) => `
        <tr>
            <td>${detalle.producto.nombre}</td>
            <td>${detalle.unidad.nombre}</td>
            <td>${(detalle.cantidad / detalle.unidad.factorConversion).toFixed(2)}</td>
            <td>Q${(detalle.precioUnitario * detalle.unidad.factorConversion).toFixed(2)}</td>
            <td>Q${detalle.totalLinea.toFixed(2)}</td>
            <td>
                <button class="action-btn delete-btn" onclick="eliminarDetalle(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function actualizarDetalleCompra() {
    const cantidad = parseFloat(document.getElementById("detalleCantidad").value) || 0;
    const precio = parseFloat(document.getElementById("detallePrecio").value) || 0;

    // Obtenemos el factor desde la unidad seleccionada
    const unidadSelect = document.getElementById("detalleUnidad");
    const factor = parseFloat(unidadSelect.selectedOptions[0]?.dataset.factor || 1);

    // Conversión para mantener inventario en unidad base
    const cantidadBase = cantidad * factor;
    const precioUnitarioBase = precio / factor;
    const total = cantidadBase * precioUnitarioBase;

    document.getElementById("detalleTotal").value = total.toFixed(2);
}

function calcularTotalLinea() {
    try {
        const cantidad = parseFloat(document.getElementById('detalleCantidad')?.value) || 0;
        const precio = parseFloat(document.getElementById('detallePrecio')?.value) || 0;
        const unidadSelect = document.getElementById('detalleUnidad');
        const factor = unidadSelect?.selectedOptions?.[0]?.dataset?.factor ? parseFloat(unidadSelect.selectedOptions[0].dataset.factor) : 1;

        // Conversión a unidad base y cálculo
        const cantidadBase = cantidad * (factor || 1);
        const precioUnitarioBase = (factor && factor > 0) ? (precio / factor) : precio;
        const total = cantidadBase * precioUnitarioBase;

        const totalInput = document.getElementById('detalleTotal');
        if (totalInput) totalInput.value = total.toFixed(2);
    } catch (e) {
        console.error('calcularTotalLinea error:', e);
    }
}

function renderComprasTable() {
    const tbody = document.getElementById('comprasTableBody');
    if (!tbody) return;

    if (!compras || compras.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">No hay compras registradas</td>
            </tr>`;
        return;
    }

    tbody.innerHTML = compras.map(c => {
        const fecha = c.fechaCompra ? new Date(c.fechaCompra).toLocaleDateString() : 'N/A';
        const proveedor = c.proveedor?.nombre || 'N/A';

        return `
            <tr>
                <td>${c.numeroFactura || '-'}</td>
                <td>${fecha}</td>
                <td>${proveedor}</td>
                <td>Q${c.total?.toFixed ? c.total.toFixed(2) : '0.00'}</td>
                <td>
                    <span class="badge ${c.estado === 'COMPLETADA' ? 'badge-success' : 'badge-danger'}">
                        ${c.estado}
                    </span>
                </td>
                <td class="actions-cell">

                    <button class="action-btn view-btn" 
                        onclick="verDetalleCompra(${c.id})" 
                        title="Ver Detalle">
                        <i class="fas fa-eye"></i>
                    </button>

                    <button class="action-btn download-btn"
                        onclick="descargarCompraPDF(${c.id})"
                        title="Descargar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>

                    ${c.estado !== 'ANULADA' ? `
                        <button class="action-btn delete-btn"
                            onclick="anularCompra(${c.id})"
                            title="Anular Compra">
                            <i class="fas fa-ban"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function calcularTotalesCompra() {
    const subtotal = detallesCompra.reduce((sum, detalle) => sum + detalle.totalLinea, 0);

    const impuestos = subtotal * 0.12;
    const total = subtotal + impuestos;

    document.getElementById('compraSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('compraImpuestos').value = impuestos.toFixed(2);
    document.getElementById('compraImpuestosTotal').textContent = impuestos.toFixed(2);
    document.getElementById('compraTotal').textContent = total.toFixed(2);
}

// Función mejorada para enviar compra
async function handleCompraSubmit(e) {
    e.preventDefault();

    if (detallesCompra.length === 0) {
        showMessage('Debe agregar al menos un detalle a la compra', 'error');
        return;
    }

    const proveedorId = parseInt(document.getElementById('compraProveedor')?.value);
    if (!proveedorId || isNaN(proveedorId)) {
        showMessage('Seleccione un proveedor válido', 'error');
        return;
    }

    const compraData = {
        numeroFactura: document.getElementById('compraFactura')?.value || '', // Se genera automático si viene vacío
        proveedorId: proveedorId,
        fechaCompra: document.getElementById('compraFecha').value,
        impuestos: parseFloat(document.getElementById('compraImpuestos')?.value) || 0,
        observaciones: document.getElementById('compraObservaciones')?.value,
        usuarioCreacion: JSON.parse(localStorage.getItem('user')).id,
        detalles: detallesCompra.map(d => ({
            productoId: d.productoId,
            unidadMedidaId: d.unidadMedidaId,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario
        }))
    };

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/compras', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(compraData)
        });

        if (response.ok) {
            const result = await response.json();
            showMessage('✅ Compra registrada exitosamente', 'success');

            // Ocultar formulario
            hideCompraForm();

            // Mostrar tabla de compras
            const lista = document.getElementById("compras-list-section");
            const form = document.getElementById("compraForm");
            if (lista) lista.style.display = "block";
            if (form) form.style.display = "none";

            // Recargar compras en pantalla (sin recargar toda la página)
            if (typeof loadCompras === "function") {
                await loadCompras();
            } else if (typeof cargarCompras === "function") {
                await cargarCompras();
            }

            // Actualizar productos e inventario al instante
            if (typeof loadProductos === "function") await loadProductos();
            if (typeof loadInventario === "function") await loadInventario();

           
            await cargarProductos();              // vuelve a traer productos actualizados desde el backend
            cargarProductosParaAjuste();          // actualiza el select del formulario de AJUSTE
            cargarProductosFiltro();              // actualiza el select del filtro de MOVIMIENTOS

            await cargarMovimientos();    
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al registrar compra', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Función para cargar compras
async function loadCompras() {
    try {
        console.log('Cargando compras...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/compras', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            compras = await response.json();
            console.log('Compras cargadas:', compras);
            renderComprasTable();
        } else {
            showMessage('Error al cargar las compras', 'error');
        }
    } catch (error) {
        console.error('Error al cargar compras:', error);
        showMessage('Error de conexión al cargar compras', 'error');
    }
}

// Función para renderizar tabla de compras
function renderComprasTable() {
    const tbody = document.getElementById('comprasTableBody');
    if (!tbody) return;

    if (!compras || compras.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No hay compras registradas</td></tr>';
        return;
    }

    tbody.innerHTML = compras.map(compra => `
        <tr>
            <td>${compra.numeroFactura}</td>
            <td>${compra.proveedor ? compra.proveedor.nombre : 'N/A'}</td>
            <td>${new Date(compra.fechaCompra).toLocaleDateString()}</td>
            <td>Q${compra.subtotal.toFixed(2)}</td>
            <td>Q${compra.impuestos.toFixed(2)}</td>
            <td>Q${compra.total.toFixed(2)}</td>
            <td>
                <span class="badge ${compra.estado === 'COMPLETADA' ? 'badge-success' : 'badge-danger'}">${compra.estado}</span>
            </td>
            <td>
                <button class="action-btn view-btn" onclick="verDetalleCompra(${compra.id})" title="Ver Detalle">
                    <i class="fas fa-eye"></i>
                </button>

                <button class="action-btn download-btn" onclick="descargarCompraPDF(${compra.id})" title="Descargar PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>

                ${compra.estado !== 'ANULADA' ? `
                    <button class="action-btn delete-btn" onclick="anularCompra(${compra.id})" title="Anular Compra">
                        <i class="fas fa-ban"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function descargarCompraPDF(id) {
    const authToken = localStorage.getItem('authToken');
    window.open(`https://localhost:7000/api/compras/${id}/pdf?Authorization=Bearer ${authToken}`, '_blank');
}

// Función para anular compra
async function anularCompra(id) {
    if (!confirm('¿Está seguro de que desea anular esta compra? Se revertirá el stock de los productos.')) {
        return;
    }

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/compras/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showMessage('Compra anulada exitosamente', 'success');
            await loadCompras();
            await loadProductos();
            await loadInventario();
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        console.error('Error al anular compra:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Función para ver detalle de compra
async function verDetalleCompra(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/compras/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const compra = await response.json();
            mostrarModalDetalleCompra(compra);
        } else {
            showMessage('Error al cargar el detalle de la compra', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Función para mostrar modal con detalle de compra
function mostrarModalDetalleCompra(compra) {
    const modalHTML = `
        <div id="detalleCompraModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000;">
            <div style="background:white; padding:30px; border-radius:10px; width:90%; max-width:800px; max-height:80vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3>Detalle de Compra - ${compra.numeroFactura}</h3>
                    <button onclick="cerrarModalDetalleCompra()" style="background:none; border:none; font-size:20px; cursor:pointer;">×</button>
                </div>
                
                <div style="margin-bottom:20px;">
                    <p><strong>Proveedor:</strong> ${compra.proveedor ? compra.proveedor.nombre : 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${new Date(compra.fechaCompra).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> <span class="badge ${compra.estado === 'COMPLETADA' ? 'badge-success' : 'badge-danger'}">${compra.estado}</span></p>
                    <p><strong>Observaciones:</strong> ${compra.observaciones || 'Ninguna'}</p>
                </div>

                <h4>Productos Comprados</h4>
                <table class="data-table" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Unidad</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${compra.detalles ? compra.detalles.map(detalle => `
                            <tr>
                                <td>${detalle.producto ? detalle.producto.nombre : 'N/A'}</td>
                                <td>${detalle.unidadMedida ? detalle.unidadMedida.nombre : 'N/A'}</td>
                                <td>${detalle.cantidad}</td>
                                <td>$${detalle.precioUnitario.toFixed(2)}</td>
                                <td>$${detalle.totalLinea.toFixed(2)}</td>
                            </tr>
                        `).join('') : ''}
                    </tbody>
                </table>

                <div style="margin-top:20px; text-align:right;">
                    <p><strong>Subtotal:</strong> $${compra.subtotal.toFixed(2)}</p>
                    <p><strong>Impuestos:</strong> $${compra.impuestos.toFixed(2)}</p>
                    <p><strong>Total:</strong> $${compra.total.toFixed(2)}</p>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function cerrarModalDetalleCompra() {
    const modal = document.getElementById('detalleCompraModal');
    if (modal) modal.remove();
}