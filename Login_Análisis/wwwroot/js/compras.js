// compras.js - Gestión completa de compras

// Variables globales para compras
let compraDetalles = [];
let currentCompraId = null;

// Inicializar módulo de compras
document.addEventListener('DOMContentLoaded', () => {
    setupComprasEventListeners();
});

function setupComprasEventListeners() {
    const compraForm = document.getElementById('compraFormElement');
    if (compraForm) {
        compraForm.addEventListener('submit', handleCompraSubmit);
    }
}

// Mostrar formulario de compras
function showCompraForm(compra = null) {
    openManagementTab('compras');

    const form = document.getElementById('compraForm');
    const title = document.getElementById('compraFormTitle');

    if (form) {
        if (compra) {
            title.textContent = 'Editar Compra';
            currentCompraId = compra.id;
            fillCompraForm(compra);
        } else {
            title.textContent = 'Nueva Compra';
            currentCompraId = null;
            resetCompraForm();
        }
        form.style.display = 'block';
    }
}

function resetCompraForm() {
    const form = document.getElementById('compraFormElement');
    if (form) form.reset();
    compraDetalles = [];
    renderCompraDetalles();
    calcularTotalesCompra();

    // Establecer fecha actual
    const fechaInput = document.getElementById('compraFecha');
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }
}

// Llenar formulario de compra
function fillCompraForm(compra) {
    document.getElementById('compraId').value = compra.id;
    document.getElementById('compraNumeroFactura').value = compra.numeroFactura || '';
    document.getElementById('compraProveedor').value = compra.proveedorId || '';
    document.getElementById('compraFecha').value = new Date(compra.fechaCompra).toISOString().split('T')[0];
    document.getElementById('compraImpuestos').value = compra.impuestos || 0;
    document.getElementById('compraObservaciones').value = compra.observaciones || '';

    // Cargar detalles de la compra
    if (compra.detalles && compra.detalles.length > 0) {
        compraDetalles = compra.detalles.map(detalle => ({
            productoId: detalle.productoId,
            productoNombre: detalle.producto?.nombre || 'Producto',
            unidadMedidaId: detalle.unidadMedidaId,
            unidadMedidaAbreviatura: detalle.unidadMedida?.abreviatura || 'UND',
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            totalLinea: detalle.totalLinea
        }));
        renderCompraDetalles();
        calcularTotalesCompra();
    }
}

// Ocultar formulario de compra
function hideCompraForm() {
    const form = document.getElementById('compraForm');
    if (form) form.style.display = 'none';
    currentCompraId = null;
    compraDetalles = [];
}

// Agregar producto a la compra
function agregarProductoCompra() {
    const productoSelect = document.getElementById('compraProducto');
    const cantidadInput = document.getElementById('compraCantidad');
    const unidadSelect = document.getElementById('compraUnidadMedida');
    const precioInput = document.getElementById('compraPrecio');

    const productoId = parseInt(productoSelect.value);
    const productoNombre = productoSelect.options[productoSelect.selectedIndex].text;
    const cantidad = parseFloat(cantidadInput.value);
    const unidadMedidaId = parseInt(unidadSelect.value);
    const unidadMedidaAbreviatura = unidadSelect.options[unidadSelect.selectedIndex].text;
    const precioUnitario = parseFloat(precioInput.value);

    // Validaciones
    if (!productoId || !cantidad || cantidad <= 0 || !unidadMedidaId || !precioUnitario || precioUnitario <= 0) {
        showMessage('Complete todos los campos del producto', 'error');
        return;
    }

    // Verificar si el producto ya está en la compra
    const productoExistente = compraDetalles.find(d => d.productoId === productoId);
    if (productoExistente) {
        showMessage('Este producto ya está en la compra. Puede editar la cantidad.', 'error');
        return;
    }

    const totalLinea = cantidad * precioUnitario;

    const detalle = {
        productoId: productoId,
        productoNombre: productoNombre,
        unidadMedidaId: unidadMedidaId,
        unidadMedidaAbreviatura: unidadMedidaAbreviatura,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        totalLinea: totalLinea
    };

    compraDetalles.push(detalle);
    renderCompraDetalles();
    calcularTotalesCompra();
    limpiarFormularioProductoCompra();

    showMessage('Producto agregado a la compra', 'success');
}

// Renderizar detalles de compra
function renderCompraDetalles() {
    const tbody = document.getElementById('compraDetallesBody');
    if (!tbody) return;

    if (compraDetalles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 20px; color: #6c757d;">
                    <i class="fas fa-shopping-basket" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No hay productos agregados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = compraDetalles.map((detalle, index) => `
        <tr>
            <td>${detalle.productoNombre}</td>
            <td>${detalle.cantidad}</td>
            <td>${detalle.unidadMedidaAbreviatura}</td>
            <td>${formatCurrency(detalle.precioUnitario)}</td>
            <td>${formatCurrency(detalle.totalLinea)}</td>
            <td>
                <button type="button" class="action-btn delete-btn" onclick="eliminarProductoCompra(${index})" 
                        title="Eliminar producto">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Eliminar producto de la compra
function eliminarProductoCompra(index) {
    if (confirm('¿Está seguro de eliminar este producto de la compra?')) {
        compraDetalles.splice(index, 1);
        renderCompraDetalles();
        calcularTotalesCompra();
        showMessage('Producto eliminado de la compra', 'success');
    }
}

// Calcular total línea para compras
function calcularTotalLinea() {
    const cantidad = parseFloat(document.getElementById('compraCantidad').value) || 0;
    const precio = parseFloat(document.getElementById('compraPrecio').value) || 0;
    const total = cantidad * precio;

    document.getElementById('compraTotalLinea').value = total.toFixed(2);
}

// Calcular totales de la compra
function calcularTotalesCompra() {
    const subtotal = compraDetalles.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const impuestos = parseFloat(document.getElementById('compraImpuestos').value) || 0;
    const total = subtotal + impuestos;

    // Actualizar UI
    document.getElementById('compraSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('compraImpuestosMonto').textContent = formatCurrency(impuestos);
    document.getElementById('compraTotal').textContent = formatCurrency(total);
}

// Limpiar formulario de producto en compras
function limpiarFormularioProductoCompra() {
    document.getElementById('compraProducto').value = '';
    document.getElementById('compraCantidad').value = '1';
    document.getElementById('compraUnidadMedida').value = '';
    document.getElementById('compraPrecio').value = '';
    document.getElementById('compraTotalLinea').value = '';
}

// Manejar envío del formulario de compra
async function handleCompraSubmit(e) {
    e.preventDefault();

    if (compraDetalles.length === 0) {
        showMessage('Agregue al menos un producto a la compra', 'error');
        return;
    }

    const numeroFactura = document.getElementById('compraNumeroFactura').value.trim();
    const proveedorId = document.getElementById('compraProveedor').value;
    const fechaCompra = document.getElementById('compraFecha').value;
    const impuestos = parseFloat(document.getElementById('compraImpuestos').value) || 0;
    const observaciones = document.getElementById('compraObservaciones').value;

    // Validaciones
    if (!numeroFactura) {
        showMessage('El número de factura es obligatorio', 'error');
        return;
    }

    if (!proveedorId) {
        showMessage('Debe seleccionar un proveedor', 'error');
        return;
    }

    const compraData = {
        NumeroFactura: numeroFactura,
        ProveedorId: parseInt(proveedorId),
        FechaCompra: fechaCompra,
        Impuestos: impuestos,
        Observaciones: observaciones,
        Detalles: compraDetalles.map(detalle => ({
            ProductoId: detalle.productoId,
            UnidadMedidaId: detalle.unidadMedidaId,
            Cantidad: detalle.cantidad,
            PrecioUnitario: detalle.precioUnitario
        }))
    };

    try {
        const submitBtn = document.querySelector('#compraFormElement button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Procesando...';

        let response;
        const url = currentCompraId
            ? `https://localhost:7000/api/compras/${currentCompraId}`
            : 'https://localhost:7000/api/compras';

        const method = currentCompraId ? 'PUT' : 'POST';

        response = await apiCall(url, {
            method: method,
            body: JSON.stringify(compraData)
        });

        showMessage('Compra guardada exitosamente', 'success');
        hideCompraForm();
        loadCompras();

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al guardar compra', 'error');
    } finally {
        const submitBtn = document.querySelector('#compraFormElement button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = currentCompraId ? 'Actualizar Compra' : 'Guardar Compra';
        }
    }
}

// Cargar compras
async function loadCompras() {
    try {
        compras = await apiCall('https://localhost:7000/api/compras');
        renderComprasTable();
    } catch (error) {
        console.error('Error al cargar compras:', error);
        showMessage('Error al cargar compras', 'error');
    }
}

// Renderizar tabla de compras
function renderComprasTable() {
    const tbody = document.getElementById('comprasTableBody');
    if (!tbody) return;

    if (!compras || compras.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding: 20px; color: #6c757d;">
                    <i class="fas fa-shopping-basket" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No hay compras registradas
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = compras.map(compra => `
        <tr>
            <td>${compra.numeroFactura}</td>
            <td>${compra.proveedor?.nombre || 'N/A'}</td>
            <td>${new Date(compra.fechaCompra).toLocaleDateString()}</td>
            <td>${formatCurrency(compra.subtotal)}</td>
            <td>${formatCurrency(compra.impuestos)}</td>
            <td>${formatCurrency(compra.total)}</td>
            <td>
                <span class="badge ${compra.estado === 'COMPLETADA' ? 'badge-success' : compra.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-danger'}">
                    ${compra.estado}
                </span>
            </td>
            <td>
                <button class="action-btn view-btn" onclick="verDetalleCompra(${compra.id})" title="Ver detalle">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editarCompra(${compra.id})" title="Editar compra">
                    <i class="fas fa-edit"></i>
                </button>
                ${compra.estado !== 'ANULADA' ? `
                <button class="action-btn delete-btn" onclick="anularCompra(${compra.id})" title="Anular compra">
                    <i class="fas fa-ban"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Ver detalle de compra
async function verDetalleCompra(id) {
    try {
        const compra = await apiCall(`https://localhost:7000/api/compras/${id}`);
        mostrarModalDetalleCompra(compra);
    } catch (error) {
        showMessage('Error al cargar detalle de compra', 'error');
    }
}

// Mostrar modal con detalle de compra
function mostrarModalDetalleCompra(compra) {
    const modalHTML = `
        <div id="detalleCompraModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalle de Compra - ${compra.numeroFactura}</h3>
                    <button class="modal-close" onclick="cerrarModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="info-grid">
                        <div><strong>Proveedor:</strong> ${compra.proveedor?.nombre || 'N/A'}</div>
                        <div><strong>Fecha:</strong> ${new Date(compra.fechaCompra).toLocaleDateString()}</div>
                        <div><strong>Estado:</strong> ${compra.estado}</div>
                    </div>

                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${compra.detalles?.map(detalle => `
                                <tr>
                                    <td>${detalle.producto?.nombre || 'Producto'}</td>
                                    <td>${detalle.cantidad} ${detalle.unidadMedida?.abreviatura || 'UND'}</td>
                                    <td>${formatCurrency(detalle.precioUnitario)}</td>
                                    <td>${formatCurrency(detalle.totalLinea)}</td>
                                </tr>
                            `).join('') || ''}
                        </tbody>
                    </table>

                    <div class="totales-section">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(compra.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <span>Impuestos:</span>
                            <span>${formatCurrency(compra.impuestos)}</span>
                        </div>
                        <div class="total-row total-final">
                            <span>Total:</span>
                            <span>${formatCurrency(compra.total)}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal()">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente si hay uno
    const existingModal = document.getElementById('detalleCompraModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Editar compra
async function editarCompra(id) {
    try {
        const compra = await apiCall(`https://localhost:7000/api/compras/${id}`);
        showCompraForm(compra);
    } catch (error) {
        showMessage('Error al cargar compra para editar', 'error');
    }
}

// Anular compra
async function anularCompra(id) {
    if (!confirm('¿Está seguro de anular esta compra? Esta acción no se puede deshacer.')) return;

    try {
        await apiCall(`https://localhost:7000/api/compras/${id}`, {
            method: 'DELETE'
        });

        showMessage('Compra anulada exitosamente', 'success');
        loadCompras();
    } catch (error) {
        showMessage(error.message || 'Error al anular compra', 'error');
    }
}