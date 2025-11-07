// ventas.js - Sistema completo de ventas

// Variables globales para ventas
let ventaDetalles = [];
let currentVentaId = null;

// Inicializar módulo de ventas
document.addEventListener('DOMContentLoaded', () => {
    setupVentasEventListeners();
});

function setupVentasEventListeners() {
    // Event listeners para el formulario de ventas
    const ventaForm = document.getElementById('ventaFormElement');
    if (ventaForm) {
        ventaForm.addEventListener('submit', handleVentaSubmit);
    }

    // Event listeners para cálculos en tiempo real
    const descuentoGlobal = document.getElementById('ventaDescuentoGlobal');
    const aplicarIVA = document.getElementById('ventaAplicarIVA');

    if (descuentoGlobal) {
        descuentoGlobal.addEventListener('input', calcularTotalesVenta);
    }
    if (aplicarIVA) {
        aplicarIVA.addEventListener('change', calcularTotalesVenta);
    }

    // Event listener para alternar entre cliente registrado y no registrado
    const clienteSelect = document.getElementById('ventaCliente');
    if (clienteSelect) {
        clienteSelect.addEventListener('change', function () {
            const nombreClienteGroup = document.getElementById('ventaNombreCliente').closest('.form-group');
            const nitClienteGroup = document.getElementById('ventaNITCliente').closest('.form-group');

            if (this.value) {
                // Cliente registrado seleccionado
                if (nombreClienteGroup) nombreClienteGroup.style.display = 'none';
                if (nitClienteGroup) nitClienteGroup.style.display = 'none';
            } else {
                // Cliente no registrado
                if (nombreClienteGroup) nombreClienteGroup.style.display = 'block';
                if (nitClienteGroup) nitClienteGroup.style.display = 'block';
            }
        });
    }
}

// Mostrar formulario de ventas
function showVentaForm(venta = null) {
    openManagementTab('ventas');

    const form = document.getElementById('ventaForm');
    const title = document.getElementById('ventaFormTitle');

    if (form) {
        if (venta) {
            title.textContent = 'Editar Venta';
            currentVentaId = venta.id;
            fillVentaForm(venta);
        } else {
            title.textContent = 'Nueva Venta';
            currentVentaId = null;
            document.getElementById('ventaFormElement').reset();
            ventaDetalles = [];
            renderVentaDetalles();
            calcularTotalesVenta();
        }
        form.style.display = 'block';
    }
}

// Llenar formulario de venta
function fillVentaForm(venta) {
    document.getElementById('ventaId').value = venta.id;
    document.getElementById('ventaFecha').value = new Date(venta.fechaVenta).toISOString().split('T')[0];

    if (venta.clienteId) {
        document.getElementById('ventaCliente').value = venta.clienteId;
    } else {
        document.getElementById('ventaNombreCliente').value = venta.nombreCliente || '';
        document.getElementById('ventaNITCliente').value = venta.nitCliente || '';
    }

    document.getElementById('ventaDescuentoGlobal').value = venta.descuentoGlobal || 0;
    document.getElementById('ventaAplicarIVA').checked = venta.aplicarIVA !== false;

    // Cargar detalles de la venta
    if (venta.detalles && venta.detalles.length > 0) {
        ventaDetalles = venta.detalles.map(detalle => ({
            productoId: detalle.productoId,
            productoNombre: detalle.producto?.nombre || 'Producto',
            unidadMedidaId: detalle.unidadMedidaId,
            unidadMedidaAbreviatura: detalle.unidadMedida?.abreviatura || 'UND',
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            descuentoAplicado: detalle.descuentoAplicado || 0,
            totalLinea: detalle.totalLinea
        }));
        renderVentaDetalles();
        calcularTotalesVenta();
    }
}

// Ocultar formulario de venta
function hideVentaForm() {
    const form = document.getElementById('ventaForm');
    if (form) form.style.display = 'none';
    currentVentaId = null;
    ventaDetalles = [];
}

// Agregar producto a la venta
function agregarProductoVenta() {
    const productoSelect = document.getElementById('ventaProducto');
    const cantidadInput = document.getElementById('ventaCantidad');
    const unidadSelect = document.getElementById('ventaUnidadMedida');
    const descuentoInput = document.getElementById('ventaDescuentoProducto');

    const productoId = parseInt(productoSelect.value);
    const productoNombre = productoSelect.options[productoSelect.selectedIndex].text;
    const cantidad = parseFloat(cantidadInput.value);
    const unidadMedidaId = parseInt(unidadSelect.value);
    const unidadMedidaAbreviatura = unidadSelect.options[unidadSelect.selectedIndex].text;
    const descuento = parseFloat(descuentoInput.value) || 0;

    if (!productoId || !cantidad || cantidad <= 0 || !unidadMedidaId) {
        showMessage('Complete todos los campos del producto', 'error');
        return;
    }

    // Verificar si el producto ya está en la venta
    const productoExistente = ventaDetalles.find(d => d.productoId === productoId);
    if (productoExistente) {
        showMessage('Este producto ya está en la venta. Puede editar la cantidad.', 'error');
        return;
    }

    // Obtener precio del producto
    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        showMessage('Producto no encontrado', 'error');
        return;
    }

    // Verificar stock
    if (producto.stockActual < cantidad) {
        showMessage(`Stock insuficiente. Stock disponible: ${producto.stockActual}`, 'error');
        return;
    }

    const precioUnitario = producto.precioVenta;
    const totalLinea = cantidad * precioUnitario * (1 - descuento / 100);

    const detalle = {
        productoId: productoId,
        productoNombre: productoNombre,
        unidadMedidaId: unidadMedidaId,
        unidadMedidaAbreviatura: unidadMedidaAbreviatura,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        descuentoAplicado: descuento,
        totalLinea: totalLinea
    };

    ventaDetalles.push(detalle);
    renderVentaDetalles();
    calcularTotalesVenta();
    limpiarFormularioProducto();
}

// Renderizar detalles de venta
function renderVentaDetalles() {
    const tbody = document.getElementById('ventaDetallesBody');
    if (!tbody) return;

    tbody.innerHTML = ventaDetalles.map((detalle, index) => `
        <tr>
            <td>${detalle.productoNombre}</td>
            <td>${detalle.cantidad}</td>
            <td>${detalle.unidadMedidaAbreviatura}</td>
            <td>Q ${detalle.precioUnitario.toFixed(2)}</td>
            <td>${detalle.descuentoAplicado}%</td>
            <td>Q ${detalle.totalLinea.toFixed(2)}</td>
            <td>
                <button type="button" class="action-btn delete-btn" onclick="eliminarProductoVenta(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Eliminar producto de la venta
function eliminarProductoVenta(index) {
    ventaDetalles.splice(index, 1);
    renderVentaDetalles();
    calcularTotalesVenta();
}

// Calcular totales de la venta
function calcularTotalesVenta() {
    const subtotal = ventaDetalles.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const descuentoGlobal = parseFloat(document.getElementById('ventaDescuentoGlobal').value) || 0;
    const aplicarIVA = document.getElementById('ventaAplicarIVA').checked;

    const subtotalConDescuento = Math.max(0, subtotal - descuentoGlobal);
    const impuestos = aplicarIVA ? subtotalConDescuento * 0.12 : 0; // 12% IVA Guatemala
    const total = subtotalConDescuento + impuestos;

    document.getElementById('ventaSubtotal').textContent = `Q ${subtotal.toFixed(2)}`;
    document.getElementById('ventaDescuentoGlobalMonto').textContent = `Q ${descuentoGlobal.toFixed(2)}`;
    document.getElementById('ventaImpuestos').textContent = `Q ${impuestos.toFixed(2)}`;
    document.getElementById('ventaTotal').textContent = `Q ${total.toFixed(2)}`;
}

// Limpiar formulario de producto
function limpiarFormularioProducto() {
    document.getElementById('ventaProducto').value = '';
    document.getElementById('ventaCantidad').value = '1';
    document.getElementById('ventaDescuentoProducto').value = '0';
}

// Manejar envío del formulario de venta
async function handleVentaSubmit(e) {
    e.preventDefault();

    if (ventaDetalles.length === 0) {
        showMessage('Agregue al menos un producto a la venta', 'error');
        return;
    }

    const clienteId = document.getElementById('ventaCliente').value;
    const nombreCliente = document.getElementById('ventaNombreCliente').value;
    const nitCliente = document.getElementById('ventaNITCliente').value;
    const fechaVenta = document.getElementById('ventaFecha').value;
    const descuentoGlobal = parseFloat(document.getElementById('ventaDescuentoGlobal').value) || 0;
    const aplicarIVA = document.getElementById('ventaAplicarIVA').checked;
    const observaciones = document.getElementById('ventaObservaciones').value;

    // Validar cliente
    if (!clienteId && (!nombreCliente || !nitCliente)) {
        showMessage('Debe seleccionar un cliente o ingresar nombre y NIT', 'error');
        return;
    }

    const ventaData = {
        fechaVenta: fechaVenta,
        clienteId: clienteId ? parseInt(clienteId) : null,
        nombreCliente: nombreCliente,
        nitCliente: nitCliente,
        descuentoGlobal: descuentoGlobal,
        aplicarIVA: aplicarIVA,
        observaciones: observaciones,
        detalles: ventaDetalles.map(detalle => ({
            productoId: detalle.productoId,
            unidadMedidaId: detalle.unidadMedidaId,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            descuentoAplicado: detalle.descuentoAplicado
        }))
    };

    try {
        const authToken = localStorage.getItem('authToken');
        let response;

        if (currentVentaId) {
            response = await fetch(`https://localhost:7000/api/ventas/${currentVentaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(ventaData)
            });
        } else {
            response = await fetch('https://localhost:7000/api/ventas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(ventaData)
            });
        }

        if (response.ok) {
            const result = await response.json();
            showMessage('Venta guardada exitosamente', 'success');
            hideVentaForm();
            loadVentas();

            // Generar PDF de la factura si es una venta nueva
            if (!currentVentaId && result.ventaId) {
                setTimeout(() => {
                    generarFacturaPDF(result.ventaId);
                }, 1000);
            }
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar venta', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Generar PDF de factura
async function generarFacturaPDF(ventaId) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/ventas/${ventaId}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `factura_${ventaId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } catch (error) {
        console.error('Error al generar PDF:', error);
    }
}

// Actualizar select de productos en ventas
function updateProductosVentaSelect() {
    const selectProducto = document.getElementById('ventaProducto');
    if (selectProducto && productos) {
        selectProducto.innerHTML = '<option value="">Seleccionar producto</option>' +
            productos.filter(p => p.estado && p.stockActual > 0).map(p =>
                `<option value="${p.id}">${p.nombre} (Stock: ${p.stockActual}) - Q ${p.precioVenta.toFixed(2)}</option>`
            ).join('');
    }
}

// Actualizar select de clientes en ventas
function updateClientesVentaSelect() {
    const selectCliente = document.getElementById('ventaCliente');
    if (selectCliente && clientes) {
        selectCliente.innerHTML = '<option value="">Seleccionar cliente</option>' +
            clientes.filter(c => c.estado).map(c =>
                `<option value="${c.id}">${c.nombre} (${c.nit || 'Sin NIT'})</option>`
            ).join('');
    }
}

// Cargar ventas
async function loadVentas() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/ventas', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            ventas = await response.json();
            renderVentasTable();
        } else {
            const error = await response.text();
            console.error('Error al cargar ventas:', error);
            showMessage('Error al cargar ventas', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Renderizar tabla de ventas
function renderVentasTable() {
    const tbody = document.getElementById('ventasTableBody');
    if (!tbody) return;

    tbody.innerHTML = ventas.map(venta => `
        <tr>
            <td>${venta.numeroFactura}</td>
            <td>${new Date(venta.fechaVenta).toLocaleDateString()}</td>
            <td>${venta.nombreCliente || venta.cliente?.nombre || 'Cliente General'}</td>
            <td>${venta.nitCliente || venta.cliente?.nit || '-'}</td>
            <td>Q ${venta.subtotal?.toFixed(2) || '0.00'}</td>
            <td>Q ${venta.impuestos?.toFixed(2) || '0.00'}</td>
            <td>Q ${venta.total?.toFixed(2) || '0.00'}</td>
            <td>
                <span class="badge ${venta.estado === 'COMPLETADA' ? 'badge-success' : 'badge-warning'}">
                    ${venta.estado}
                </span>
            </td>
            <td>
                <button class="action-btn view-btn" onclick="verDetalleVenta(${venta.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editarVenta(${venta.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn pdf-btn" onclick="generarFacturaPDF(${venta.id})">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Ver detalle de venta
async function verDetalleVenta(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/ventas/${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const venta = await response.json();
            mostrarModalDetalleVenta(venta);
        } else {
            showMessage('Error al cargar detalle de venta', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

// Mostrar modal con detalle de venta
function mostrarModalDetalleVenta(venta) {
    const modalHTML = `
        <div id="detalleVentaModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000;">
            <div style="background:white; padding:30px; border-radius:10px; width:90%; max-width:800px; max-height:90vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="margin:0; color:#4e73df;">Detalle de Venta - ${venta.numeroFactura}</h3>
                    <button onclick="cerrarModal()" style="background:none; border:none; font-size:24px; cursor:pointer; color:#6c757d;">×</button>
                </div>
                
                <div style="margin-bottom:20px;">
                    <p><strong>Cliente:</strong> ${venta.nombreCliente || venta.cliente?.nombre || 'Cliente General'}</p>
                    <p><strong>NIT:</strong> ${venta.nitCliente || venta.cliente?.nit || '-'}</p>
                    <p><strong>Fecha:</strong> ${new Date(venta.fechaVenta).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> ${venta.estado}</p>
                </div>

                <table class="data-table" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Descuento</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${venta.detalles?.map(detalle => `
                            <tr>
                                <td>${detalle.producto?.nombre || 'Producto'}</td>
                                <td>${detalle.cantidad} ${detalle.unidadMedida?.abreviatura || 'UND'}</td>
                                <td>Q ${detalle.precioUnitario?.toFixed(2)}</td>
                                <td>${detalle.descuentoAplicado || 0}%</td>
                                <td>Q ${detalle.totalLinea?.toFixed(2)}</td>
                            </tr>
                        `).join('') || ''}
                    </tbody>
                </table>

                <div style="margin-top:20px; text-align:right; border-top:2px solid #4e73df; padding-top:10px;">
                    <p><strong>Subtotal:</strong> Q ${venta.subtotal?.toFixed(2)}</p>
                    <p><strong>Descuento Global:</strong> Q ${venta.descuentoGlobal?.toFixed(2)}</p>
                    <p><strong>Impuestos:</strong> Q ${venta.impuestos?.toFixed(2)}</p>
                    <p><strong>Total:</strong> Q ${venta.total?.toFixed(2)}</p>
                </div>

                <div style="margin-top:20px; text-align:center;">
                    <button class="btn btn-primary" onclick="generarFacturaPDF(${venta.id})">
                        <i class="fas fa-file-pdf"></i> Descargar Factura
                    </button>
                    <button class="btn btn-secondary" onclick="cerrarModal()">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente si hay uno
    const existingModal = document.getElementById('detalleVentaModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Cerrar modal
function cerrarModal() {
    const modal = document.getElementById('detalleVentaModal');
    if (modal) {
        modal.remove();
    }
}

// Editar venta
async function editarVenta(id) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/ventas/${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const venta = await response.json();
            showVentaForm(venta);
        } else {
            showMessage('Error al cargar venta para editar', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}