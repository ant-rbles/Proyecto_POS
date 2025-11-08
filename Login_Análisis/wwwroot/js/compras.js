// Variables globales para compras
let detallesCompra = [];
let compras = [];
let proveedores = [];
let productos = [];
let unidadesMedida = [];

// Función para cargar todos los datos de compras
async function cargarDatosCompras() {
    console.log('Iniciando carga de datos para compras...');

    try {
        console.log('1. Cargando proveedores...');
        await loadProveedores();

        console.log('2. Cargando productos...');
        await loadProductos();

        console.log('3. Cargando unidades de medida...');
        await loadUnidadesMedida(); // ¡ESTA LÍNEA FALTABA!

        console.log('4. Cargando compras...');
        await loadCompras();

        console.log('Todos los datos de compras cargados correctamente');

    } catch (error) {
        console.error('Error en carga de datos:', error);
        showMessage('Error al cargar los datos de compras', 'error');
    }
}
// Cargar unidades de medida
async function loadUnidadesMedida() {
    try {
        console.log('Cargando unidades de medida...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/unidadesmedida', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            unidadesMedida = await response.json();
            console.log('Unidades de medida cargadas:', unidadesMedida);

            if (unidadesMedida && unidadesMedida.length > 0) {
                cargarUnidadesParaCompra();
            } else {
                console.warn('No se recibieron unidades de medida');
            }
        } else {
            console.error('Error en la respuesta:', response.status);
        }
    } catch (error) {
        console.error('Error cargando unidades de medida:', error);
        throw error;
    }
}

// Cargar unidades en el select
function cargarUnidadesParaCompra() {
    const select = document.getElementById('detalleUnidad');

    if (!select) {
        console.error('No se encontro el select de unidades (detalleUnidad)');
        return;
    }

    if (!unidadesMedida || unidadesMedida.length === 0) {
        select.innerHTML = '<option value="">No hay unidades disponibles</option>';
        return;
    }

    const unidadesActivas = unidadesMedida.filter(u => u.estado);

    if (unidadesActivas.length === 0) {
        select.innerHTML = '<option value="">No hay unidades activas</option>';
        return;
    }

    let optionsHTML = '<option value="">Seleccionar unidad</option>';

    unidadesActivas.forEach(unidad => {
        optionsHTML += `<option value="${unidad.id}" data-factor="${unidad.factorConversion}">
            ${unidad.nombre} (${unidad.abreviatura}) ${unidad.esUnidadBase ? '- BASE' : ''}
        </option>`;
    });

    select.innerHTML = optionsHTML;
    console.log('Unidades cargadas en el select');
}

// Cargar proveedores
async function loadProveedores() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/proveedores', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            proveedores = await response.json();
            updateProveedoresSelect();
        }
    } catch (error) {
        console.error('Error cargando proveedores:', error);
    }
}

// Cargar productos
async function loadProductos() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/productos', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            productos = await response.json();
            updateProductosSelects();
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

// Cargar compras
async function loadCompras() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/compras', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            compras = await response.json();
            renderComprasTable();
        }
    } catch (error) {
        console.error('Error cargando compras:', error);
    }
}

// Actualizar selects
function updateProveedoresSelect() {
    const select = document.getElementById('compraProveedor');
    if (select) {
        select.innerHTML = '<option value="">Seleccionar proveedor</option>' +
            proveedores.filter(p => p.estado).map(p =>
                `<option value="${p.id}">${p.nombre}</option>`
            ).join('');
    }
}

function updateProductosSelects() {
    const select = document.getElementById('detalleProducto');
    if (select) {
        select.innerHTML = '<option value="">Seleccionar producto</option>' +
            productos.filter(p => p.estado).map(p =>
                `<option value="${p.id}">${p.nombre}</option>`
            ).join('');
    }
}

// Mostrar formulario de compra
function showCompraForm() {
    console.log('Mostrando formulario de compra');
    const form = document.getElementById('compraForm');
    if (form) {
        form.style.display = 'block';

        // Establecer fecha actual
        document.getElementById('compraFecha').value = new Date().toISOString().split('T')[0];

        // Reiniciar
        detallesCompra = [];
        renderDetallesTable();
        calcularTotalesCompra();

        // Cargar datos si no están cargados
        if (proveedores.length === 0 || productos.length === 0 || unidadesMedida.length === 0) {
            cargarDatosCompras();
        }
    }
}

// Ocultar formulario
function hideCompraForm() {
    const form = document.getElementById('compraForm');
    if (form) form.style.display = 'none';
    detallesCompra = [];
}

// Agregar detalle
function agregarDetalleCompra() {
    const productoId = parseInt(document.getElementById('detalleProducto').value);
    const unidadId = parseInt(document.getElementById('detalleUnidad').value);
    const cantidad = parseFloat(document.getElementById('detalleCantidad').value) || 0;
    const precio = parseFloat(document.getElementById('detallePrecio').value) || 0;

    // Validaciones
    if (!productoId) {
        showMessage('Seleccione un producto', 'error');
        return;
    }
    if (!unidadId) {
        showMessage('Seleccione una unidad', 'error');
        return;
    }
    if (cantidad <= 0) {
        showMessage('La cantidad debe ser mayor a 0', 'error');
        return;
    }
    if (precio <= 0) {
        showMessage('El precio debe ser mayor a 0', 'error');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    const unidad = unidadesMedida.find(u => u.id === unidadId);

    const detalle = {
        productoId: productoId,
        unidadMedidaId: unidadId,
        cantidad: cantidad,
        precioUnitario: precio,
        totalLinea: cantidad * precio,
        producto: producto,
        unidad: unidad
    };

    detallesCompra.push(detalle);
    renderDetallesTable();
    calcularTotalesCompra();

    // Limpiar campos
    document.getElementById('detalleProducto').selectedIndex = 0;
    document.getElementById('detalleUnidad').selectedIndex = 0;
    document.getElementById('detalleCantidad').value = '1';
    document.getElementById('detallePrecio').value = '0';
}

// Renderizar detalles
function renderDetallesTable() {
    const tbody = document.getElementById('detallesTableBody');
    if (!tbody) return;

    if (detallesCompra.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay productos</td></tr>';
        return;
    }

    tbody.innerHTML = detallesCompra.map((detalle, index) => `
        <tr>
            <td>${detalle.producto.nombre}</td>
            <td>${detalle.unidad.abreviatura}</td>
            <td class="text-right">${detalle.cantidad}</td>
            <td class="text-right">Q ${detalle.precioUnitario.toFixed(2)}</td>
            <td class="text-right">Q ${detalle.totalLinea.toFixed(2)}</td>
            <td class="text-center">
                <button class="action-btn delete-btn" onclick="eliminarDetalleCompra(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Eliminar detalle
function eliminarDetalleCompra(index) {
    detallesCompra.splice(index, 1);
    renderDetallesTable();
    calcularTotalesCompra();
}

// Calcular total línea en tiempo real
function calcularTotalLinea() {
    const cantidad = parseFloat(document.getElementById('detalleCantidad').value) || 0;
    const precio = parseFloat(document.getElementById('detallePrecio').value) || 0;
    const total = cantidad * precio;

    document.getElementById('detalleTotal').value = total.toFixed(2);
}

// Calcular totales
function calcularTotalesCompra() {
    const subtotal = detallesCompra.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    document.getElementById('compraSubtotal').textContent = `Q ${subtotal.toFixed(2)}`;
    document.getElementById('compraIVA').textContent = `Q ${iva.toFixed(2)}`;
    document.getElementById('compraTotal').textContent = `Q ${total.toFixed(2)}`;
}

// Enviar compra
async function handleCompraSubmit(e) {
    e.preventDefault();

    if (detallesCompra.length === 0) {
        showMessage('Agregue productos a la compra', 'error');
        return;
    }

    const proveedorId = parseInt(document.getElementById('compraProveedor').value);
    if (!proveedorId) {
        showMessage('Seleccione un proveedor', 'error');
        return;
    }

    const compraData = {
        numeroFactura: document.getElementById('compraFactura').value,
        proveedorId: proveedorId,
        fechaCompra: document.getElementById('compraFecha').value,
        impuestos: 0,
        observaciones: document.getElementById('compraObservaciones').value,
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
            showMessage('Compra registrada exitosamente', 'success');
            hideCompraForm();
            await loadCompras();
        } else {
            const error = await response.json();
            showMessage('Error: ' + error.message, 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

// Renderizar tabla de compras
function renderComprasTable() {
    const tbody = document.getElementById('comprasTableBody');
    if (!tbody) return;

    if (compras.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay compras</td></tr>';
        return;
    }

    tbody.innerHTML = compras.map(compra => `
        <tr>
            <td>${compra.numeroFactura}</td>
            <td>${compra.proveedor ? compra.proveedor.nombre : 'N/A'}</td>
            <td>${new Date(compra.fechaCompra).toLocaleDateString()}</td>
            <td class="text-right">Q ${compra.total?.toFixed(2) || '0.00'}</td>
            <td class="text-center">
                <span class="badge ${compra.estado === 'COMPLETADA' ? 'badge-success' : 'badge-danger'}">
                    ${compra.estado}
                </span>
            </td>
            <td class="text-center">
                <button class="action-btn view-btn" onclick="verDetalleCompra(${compra.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn info-btn" onclick="descargarFacturaCompra(${compra.id})">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Descargar PDF
async function descargarFacturaCompra(compraId) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/compras/${compraId}/pdf`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compra_${compraId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            showMessage('PDF descargado', 'success');
        }
    } catch (error) {
        showMessage('Error al descargar PDF', 'error');
    }
}

// Ver detalle
function verDetalleCompra(compraId) {
    const compra = compras.find(c => c.id === compraId);
    if (compra) {
        alert(`Detalle de compra ${compra.numeroFactura}\nProveedor: ${compra.proveedor?.nombre}\nTotal: Q ${compra.total}`);
    }
}

// Configurar event listeners cuando se carga la página
document.addEventListener('DOMContentLoaded', function () {
    console.log('Módulo de compras cargado');

    const compraFormElement = document.getElementById('compraFormElement');
    if (compraFormElement) {
        compraFormElement.addEventListener('submit', handleCompraSubmit);
    }
});