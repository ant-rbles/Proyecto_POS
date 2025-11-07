// Funciones para Ventas
function showVentaForm() {
    console.log('Mostrando formulario de venta');
    openManagementTab('ventas');
    const form = document.getElementById('ventaForm');
    if (form) {
        form.style.display = 'block';

        // Reiniciar formulario
        document.getElementById('ventaFormElement').reset();
        document.getElementById('ventaAplicarIVA').checked = true;
        document.getElementById('ventaDescuentoGlobal').value = '0';

        // Reiniciar detalles
        detallesVenta = [];
        renderDetallesVentaTable();
        calcularTotalesVenta();

        // Cargar datos necesarios
        updateProductosSelectVenta();
    }
}

function hideVentaForm() {
    const form = document.getElementById('ventaForm');
    if (form) form.style.display = 'none';
    detallesVenta = [];
}

function updateProductosSelectVenta() {
    const select = document.getElementById('ventaProducto');
    if (!select || !productos) return;

    select.innerHTML = '<option value="">Seleccionar producto...</option>' +
        productos.filter(p => p.estado).map(p => {
            const precio = p.precioVenta || 0;
            const stock = p.stockActual || 0;
            return `<option value="${p.id}" data-precio="${precio}" data-stock="${stock}">
                ${p.nombre} - Q${precio.toFixed(2)} (Stock: ${stock.toFixed(2)})
            </option>`;
        }).join('');
}

// Búsqueda de cliente por NIT
async function buscarClientePorNIT() {
    const nit = document.getElementById('ventaClienteNIT').value.trim();
    if (!nit) {
        showMessage('Ingrese un NIT para buscar', 'error');
        return;
    }

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/clientes/buscar-por-nit/${nit}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const cliente = await response.json();
            document.getElementById('ventaClienteId').value = cliente.id;
            document.getElementById('ventaClienteNombre').value = cliente.nombre;
            showMessage('Cliente encontrado', 'success');
        } else {
            // Si no existe, permitir ingresar manualmente
            document.getElementById('ventaClienteId').value = '';
            document.getElementById('ventaClienteNombre').value = '';
            document.getElementById('ventaClienteNombre').focus();
            showMessage('Cliente no encontrado. Puede ingresar el nombre manualmente', 'warning');
        }
    } catch (error) {
        console.error('Error buscando cliente:', error);
        showMessage('Error al buscar cliente', 'error');
    }
}

// Cuando se selecciona un producto en ventas
function onProductoSelectChange() {
    const select = document.getElementById('ventaProducto');
    const selectedOption = select.options[select.selectedIndex];

    if (selectedOption.value) {
        const precio = parseFloat(selectedOption.getAttribute('data-precio')) || 0;
        const stock = parseFloat(selectedOption.getAttribute('data-stock')) || 0;

        document.getElementById('ventaPrecioUnitario').value = precio.toFixed(2);

        // Mostrar información de stock
        if (stock <= 0) {
            showMessage('Producto sin stock disponible', 'warning');
        }
    }
}

function agregarDetalleVenta() {
    const productoSelect = document.getElementById('ventaProducto');
    const productoId = parseInt(productoSelect.value);
    const cantidad = parseFloat(document.getElementById('ventaCantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('ventaPrecioUnitario').value) || 0;
    const descuento = parseFloat(document.getElementById('ventaDescuentoProducto').value) || 0;

    // Validaciones
    if (!productoId) {
        showMessage('Seleccione un producto', 'error');
        return;
    }
    if (cantidad <= 0) {
        showMessage('La cantidad debe ser mayor a 0', 'error');
        return;
    }

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

    // Calcular precios con descuento
    const precioConDescuento = precioUnitario * (1 - descuento / 100);
    const totalLinea = cantidad * precioConDescuento;

    const detalle = {
        productoId: productoId,
        productoNombre: producto.nombre,
        unidadMedidaId: producto.unidadMedidaBaseId,
        cantidad: cantidad,
        precioUnitario: precioConDescuento,
        descuentoAplicado: descuento,
        totalLinea: totalLinea
    };

    detallesVenta.push(detalle);
    renderDetallesVentaTable();
    calcularTotalesVenta();

    // Limpiar campos del detalle
    document.getElementById('ventaCantidad').value = '1';
    document.getElementById('ventaDescuentoProducto').value = '0';
    document.getElementById('ventaProducto').selectedIndex = 0;
    document.getElementById('ventaPrecioUnitario').value = '0';
}

function renderDetallesVentaTable() {
    const tbody = document.getElementById('detallesVentaTableBody');
    if (!tbody) return;

    if (detallesVenta.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay productos agregados</td></tr>';
        return;
    }

    tbody.innerHTML = detallesVenta.map((detalle, index) => `
        <tr>
            <td>${detalle.productoNombre}</td>
            <td>${detalle.cantidad}</td>
            <td>Q ${detalle.precioUnitario.toFixed(2)}</td>
            <td>${detalle.descuentoAplicado}%</td>
            <td>Q ${detalle.totalLinea.toFixed(2)}</td>
            <td>
                <button class="action-btn delete-btn" onclick="eliminarDetalleVenta(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function eliminarDetalleVenta(index) {
    detallesVenta.splice(index, 1);
    renderDetallesVentaTable();
    calcularTotalesVenta();
}

function calcularTotalesVenta() {
    const subtotal = detallesVenta.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const descuentoGlobal = parseFloat(document.getElementById('ventaDescuentoGlobal').value) || 0;
    const aplicarIVA = document.getElementById('ventaAplicarIVA').checked;

    const subtotalConDescuento = Math.max(0, subtotal - descuentoGlobal);
    const impuestos = aplicarIVA ? subtotalConDescuento * 0.12 : 0; // 12% IVA Guatemala
    const total = subtotalConDescuento + impuestos;

    document.getElementById('ventaSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('ventaDescuentoGlobalTotal').textContent = descuentoGlobal.toFixed(2);
    document.getElementById('ventaImpuestos').textContent = impuestos.toFixed(2);
    document.getElementById('ventaTotal').textContent = total.toFixed(2);
}

async function handleVentaSubmit(e) {
    e.preventDefault();

    if (detallesVenta.length === 0) {
        showMessage('Debe agregar al menos un producto a la venta', 'error');
        return;
    }

    const clienteId = document.getElementById('ventaClienteId').value;
    const clienteNombre = document.getElementById('ventaClienteNombre').value;
    const clienteNIT = document.getElementById('ventaClienteNIT').value || 'CF';

    if (!clienteNombre) {
        showMessage('El nombre del cliente es requerido', 'error');
        return;
    }

    const ventaData = {
        fechaVenta: new Date().toISOString(),
        clienteId: clienteId ? parseInt(clienteId) : null,
        nombreCliente: clienteNombre,
        nitCliente: clienteNIT,
        descuentoGlobal: parseFloat(document.getElementById('ventaDescuentoGlobal').value) || 0,
        aplicarIVA: document.getElementById('ventaAplicarIVA').checked,
        observaciones: document.getElementById('ventaObservaciones').value,
        usuarioCreacion: JSON.parse(localStorage.getItem('user')).id,
        detalles: detallesVenta.map(detalle => ({
            productoId: detalle.productoId,
            unidadMedidaId: detalle.unidadMedidaId,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            descuentoAplicado: detalle.descuentoAplicado
        }))
    };

    console.log('Datos de venta:', ventaData);

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(ventaData)
        });

        if (response.ok) {
            const result = await response.json();
            showMessage('Venta registrada exitosamente. N° Factura: ' + result.venta.numeroFactura, 'success');

            // Limpiar formulario
            document.getElementById('ventaFormElement').reset();
            detallesVenta = [];
            renderDetallesVentaTable();
            calcularTotalesVenta();

            // Recargar productos para actualizar stock
            await loadProductos();

        } else {
            const error = await response.json();
            showMessage(' ' + (error.message || 'Error al registrar la venta'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

async function descargarFacturaPdf(ventaId) {
    try {
        const response = await fetch(`/api/ventas/${ventaId}/pdf`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `factura_${ventaId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showMessage('Factura descargada exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error al descargar la factura', 'error');
    }
}

async function cargarEstadisticasVentas() {
    try {
        const response = await fetch('/api/ventas/estadisticas');
        if (response.ok) {
            const estadisticas = await response.json();
            document.getElementById('ventasHoy').textContent = estadisticas.ventasHoy || 0;
            document.getElementById('ingresosHoy').textContent = `$${(estadisticas.ingresosHoy || 0).toFixed(2)}`;
            document.getElementById('ventasMes').textContent = estadisticas.ventasMes || 0;
            document.getElementById('ingresosMes').textContent = `$${(estadisticas.ingresosMes || 0).toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Ventas con precios fijos y descuentos
function agregarProductoVenta() {
    const productoSelect = document.getElementById('ventaProducto');
    const productoId = parseInt(productoSelect.value);
    const cantidad = parseFloat(document.getElementById('ventaCantidad').value) || 1;

    if (!productoId) {
        showMessage('Seleccione un producto', 'error');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    // Usar precio fijo del producto
    const precioUnitario = producto.precioVenta;

    // Aquí se aplicaría el descuento por cantidad (implementar lógica similar a backend)
    const descuento = calcularDescuentoPorCantidad(productoId, cantidad);
    const precioConDescuento = precioUnitario * (1 - descuento / 100);
    const totalLinea = cantidad * precioConDescuento;

    const detalle = {
        productoId: productoId,
        productoNombre: producto.nombre,
        unidadMedidaId: producto.unidadMedidaBaseId,
        cantidad: cantidad,
        precioUnitario: precioConDescuento,
        descuentoAplicado: descuento,
        totalLinea: totalLinea
    };

    detallesVenta.push(detalle);
    renderDetallesVenta();
    calcularTotalesVenta();
}

// Configuración de descuentos
function configurarDescuentos() {
    openManagementTab('descuentos');
}

function cargarUnidadesParaVenta() {
    // Implementar si es necesario para ventas
}

async function cargarVentas() {
    // Implementar carga de ventas si es necesario
    console.log('Cargando ventas...');
}