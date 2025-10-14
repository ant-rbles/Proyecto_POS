// Variables globales
let proveedores = [];
let productos = [];
let compras = [];
let unidadesMedida = [];
let detallesCompra = [];
let currentProveedorId = null;
let currentProductoId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    initializeManagement();
});

function initializeManagement() {
    // Cargar datos iniciales
    loadUnidadesMedida();
    loadProveedores();
    loadProductos();
    loadCompras();

    // Configurar event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Formulario de proveedores
    document.getElementById('proveedorFormElement').addEventListener('submit', handleProveedorSubmit);

    // Formulario de productos
    document.getElementById('productoFormElement').addEventListener('submit', handleProductoSubmit);

    // Formulario de compras
    document.getElementById('compraFormElement').addEventListener('submit', handleCompraSubmit);

    // Eventos para detalles de compra
    document.getElementById('detalleCantidad').addEventListener('input', calcularTotalLinea);
    document.getElementById('detallePrecio').addEventListener('input', calcularTotalLinea);
    document.getElementById('compraImpuestos').addEventListener('input', calcularTotalesCompra);
}

// Navegación entre pestañas
function openManagementTab(tabName) {
    document.getElementById('managementTabs').style.display = 'block';

    // Ocultar todas las pestañas
    const tabs = document.querySelectorAll('.management-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Mostrar la pestaña seleccionada
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Cargar datos específicos de la pestaña
    switch (tabName) {
        case 'proveedores':
            loadProveedores();
            break;
        case 'productos':
            loadProductos();
            loadUnidadesMedidaForSelect('productoUnidadBase');
            break;
        case 'compras':
            loadCompras();
            loadProveedoresForSelect('compraProveedor');
            loadProductosForSelect('detalleProducto');
            loadUnidadesMedidaForSelect('detalleUnidad');
            break;
        case 'inventario':
            loadInventario();
            break;
    }
}

function closeManagementTabs() {
    document.getElementById('managementTabs').style.display = 'none';
    resetForms();
}

// Funciones para Proveedores
function showProveedorForm(proveedor = null) {
    const form = document.getElementById('proveedorForm');
    const title = document.getElementById('proveedorFormTitle');

    if (proveedor) {
        title.textContent = 'Editar Proveedor';
        currentProveedorId = proveedor.id;
        fillProveedorForm(proveedor);
    } else {
        title.textContent = 'Nuevo Proveedor';
        currentProveedorId = null;
        document.getElementById('proveedorFormElement').reset();
    }

    form.style.display = 'block';
}

function hideProveedorForm() {
    document.getElementById('proveedorForm').style.display = 'none';
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

    const proveedor = {
        nombre: document.getElementById('proveedorNombre').value,
        ruc: document.getElementById('proveedorRUC').value,
        telefono: document.getElementById('proveedorTelefono').value,
        email: document.getElementById('proveedorEmail').value,
        direccion: document.getElementById('proveedorDireccion').value,
        contacto: document.getElementById('proveedorContacto').value
    };

    try {
        let response;
        if (currentProveedorId) {
            // Editar proveedor existente
            response = await fetch(`/api/proveedores/${currentProveedorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proveedor)
            });
        } else {
            // Crear nuevo proveedor
            response = await fetch('/api/proveedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proveedor)
            });
        }

        if (response.ok) {
            showMessage('Proveedor guardado exitosamente', 'success');
            hideProveedorForm();
            loadProveedores();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar el proveedor', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function loadProveedores() {
    try {
        const response = await fetch('/api/productos/proveedores');
        proveedores = await response.json();
        renderProveedoresTable();
    } catch (error) {
        showMessage('Error al cargar proveedores', 'error');
    }
}

function renderProveedoresTable() {
    const tbody = document.getElementById('proveedoresTableBody');
    tbody.innerHTML = proveedores.map(proveedor => `
        <tr>
            <td>${proveedor.nombre}</td>
            <td>${proveedor.ruc}</td>
            <td>${proveedor.telefono || '-'}</td>
            <td>${proveedor.email || '-'}</td>
            <td>${proveedor.contacto || '-'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="showProveedorForm(${JSON.stringify(proveedor).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteProveedor(${proveedor.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function deleteProveedor(id) {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return;

    try {
        const response = await fetch(`/api/proveedores/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Proveedor eliminado exitosamente', 'success');
            loadProveedores();
        } else {
            showMessage('Error al eliminar el proveedor', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

// Funciones para Productos (similar estructura a proveedores)
function showProductoForm(producto = null) {
    const form = document.getElementById('productoForm');
    const title = document.getElementById('productoFormTitle');

    if (producto) {
        title.textContent = 'Editar Producto';
        currentProductoId = producto.id;
        fillProductoForm(producto);
    } else {
        title.textContent = 'Nuevo Producto';
        currentProductoId = null;
        document.getElementById('productoFormElement').reset();
    }

    form.style.display = 'block';
}

function hideProductoForm() {
    document.getElementById('productoForm').style.display = 'none';
    currentProductoId = null;
}

function fillProductoForm(producto) {
    document.getElementById('productoId').value = producto.id;
    document.getElementById('productoCodigo').value = producto.codigo;
    document.getElementById('productoNombre').value = producto.nombre;
    document.getElementById('productoDescripcion').value = producto.descripcion || '';
    document.getElementById('productoStockMinimo').value = producto.stockMinimo;
    document.getElementById('productoMargen').value = producto.margenGanancia;

    if (producto.categoriaId) {
        document.getElementById('productoCategoria').value = producto.categoriaId;
    }

    if (producto.unidadMedidaBaseId) {
        document.getElementById('productoUnidadBase').value = producto.unidadMedidaBaseId;
    }
}

async function handleProductoSubmit(e) {
    e.preventDefault();

    const producto = {
        codigo: document.getElementById('productoCodigo').value,
        nombre: document.getElementById('productoNombre').value,
        descripcion: document.getElementById('productoDescripcion').value,
        categoriaId: document.getElementById('productoCategoria').value || null,
        unidadMedidaBaseId: parseInt(document.getElementById('productoUnidadBase').value),
        stockMinimo: parseFloat(document.getElementById('productoStockMinimo').value) || 0,
        margenGanancia: parseFloat(document.getElementById('productoMargen').value) || 30
    };

    try {
        let response;
        if (currentProductoId) {
            response = await fetch(`/api/productos/${currentProductoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });
        } else {
            response = await fetch('/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(producto)
            });
        }

        if (response.ok) {
            showMessage('Producto guardado exitosamente', 'success');
            hideProductoForm();
            loadProductos();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al guardar el producto', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function loadProductos() {
    try {
        const response = await fetch('/api/productos');
        productos = await response.json();
        renderProductosTable();
    } catch (error) {
        showMessage('Error al cargar productos', 'error');
    }
}

function renderProductosTable() {
    const tbody = document.getElementById('productosTableBody');
    tbody.innerHTML = productos.map(producto => `
        <tr>
            <td>${producto.codigo}</td>
            <td>${producto.nombre}</td>
            <td>${producto.categoria ? producto.categoria.nombre : '-'}</td>
            <td>
                <span class="stock-badge ${getStockStatusClass(producto.stockActual, producto.stockMinimo)}">
                    ${producto.stockActual}
                </span>
            </td>
            <td>$${producto.precioCostoPromedio.toFixed(2)}</td>
            <td>$${producto.precioVenta.toFixed(2)}</td>
            <td>
                <button class="action-btn edit-btn" onclick="showProductoForm(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteProducto(${producto.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStockStatusClass(stockActual, stockMinimo) {
    if (stockActual <= 0) return 'stock-critical';
    if (stockActual <= stockMinimo) return 'stock-low';
    return 'stock-normal';
}

// Funciones para Compras
function showCompraForm() {
    document.getElementById('compraForm').style.display = 'block';
    document.getElementById('compraFecha').value = new Date().toISOString().split('T')[0];
    detallesCompra = [];
    renderDetallesTable();
    calcularTotalesCompra();
}

function hideCompraForm() {
    document.getElementById('compraForm').style.display = 'none';
    document.getElementById('compraFormElement').reset();
    detallesCompra = [];
}

function agregarDetalle() {
    const productoId = document.getElementById('detalleProducto').value;
    const unidadId = document.getElementById('detalleUnidad').value;
    const cantidad = parseFloat(document.getElementById('detalleCantidad').value);
    const precio = parseFloat(document.getElementById('detallePrecio').value);

    if (!productoId || !unidadId || cantidad <= 0 || precio <= 0) {
        showMessage('Complete todos los campos del detalle', 'error');
        return;
    }

    const producto = productos.find(p => p.id == productoId);
    const unidad = unidadesMedida.find(u => u.id == unidadId);

    const detalle = {
        productoId: parseInt(productoId),
        unidadMedidaId: parseInt(unidadId),
        cantidad: cantidad,
        precioUnitario: precio,
        totalLinea: cantidad * precio,
        producto: producto,
        unidadMedida: unidad
    };

    detallesCompra.push(detalle);
    renderDetallesTable();
    calcularTotalesCompra();

    // Limpiar campos del detalle
    document.getElementById('detalleCantidad').value = '0';
    document.getElementById('detallePrecio').value = '0';
    document.getElementById('detalleTotal').value = '0';
}

function eliminarDetalle(index) {
    detallesCompra.splice(index, 1);
    renderDetallesTable();
    calcularTotalesCompra();
}

function renderDetallesTable() {
    const tbody = document.getElementById('detallesTableBody');
    tbody.innerHTML = detallesCompra.map((detalle, index) => `
        <tr>
            <td>${detalle.producto.nombre}</td>
            <td>${detalle.unidadMedida.nombre}</td>
            <td>${detalle.cantidad}</td>
            <td>$${detalle.precioUnitario.toFixed(2)}</td>
            <td>$${detalle.totalLinea.toFixed(2)}</td>
            <td>
                <button class="action-btn delete-btn" onclick="eliminarDetalle(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function calcularTotalLinea() {
    const cantidad = parseFloat(document.getElementById('detalleCantidad').value) || 0;
    const precio = parseFloat(document.getElementById('detallePrecio').value) || 0;
    document.getElementById('detalleTotal').value = (cantidad * precio).toFixed(2);
}

function calcularTotalesCompra() {
    const subtotal = detallesCompra.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const impuestos = parseFloat(document.getElementById('compraImpuestos').value) || 0;
    const total = subtotal + impuestos;

    document.getElementById('compraSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('compraImpuestosTotal').textContent = impuestos.toFixed(2);
    document.getElementById('compraTotal').textContent = total.toFixed(2);
}

async function handleCompraSubmit(e) {
    e.preventDefault();

    if (detallesCompra.length === 0) {
        showMessage('Debe agregar al menos un detalle a la compra', 'error');
        return;
    }

    const compra = {
        numeroFactura: document.getElementById('compraFactura').value,
        proveedorId: parseInt(document.getElementById('compraProveedor').value),
        fechaCompra: document.getElementById('compraFecha').value,
        impuestos: parseFloat(document.getElementById('compraImpuestos').value) || 0,
        observaciones: document.getElementById('compraObservaciones').value,
        usuarioCreacion: JSON.parse(localStorage.getItem('user')).id,
        detalles: detallesCompra.map(d => ({
            productoId: d.productoId,
            unidadMedidaId: d.unidadMedidaId,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            totalLinea: d.totalLinea
        }))
    };

    try {
        const response = await fetch('/api/productos/compras', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(compra)
        });

        if (response.ok) {
            showMessage('Compra registrada exitosamente', 'success');
            hideCompraForm();
            loadCompras();
            loadProductos(); // Recargar productos para actualizar stock
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al registrar la compra', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

// Funciones de utilidad
async function loadUnidadesMedida() {
    try {
        const response = await fetch('/api/productos/unidades-medida');
        unidadesMedida = await response.json();
    } catch (error) {
        console.error('Error loading unidades de medida:', error);
    }
}

function loadUnidadesMedidaForSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Seleccionar unidad</option>' +
        unidadesMedida.map(u => `<option value="${u.id}">${u.nombre} (${u.abreviatura})</option>`).join('');
}

function loadProveedoresForSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Seleccionar proveedor</option>' +
        proveedores.map(p => `<option value="${p.id}">${p.nombre} - ${p.ruc}</option>`).join('');
}

function loadProductosForSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Seleccionar producto</option>' +
        productos.map(p => `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`).join('');
}

function showMessage(message, type) {
    // Usar la función showMessage existente o crear una nueva
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function resetForms() {
    hideProveedorForm();
    hideProductoForm();
    hideCompraForm();
}

// Cargar este script en index.html agregando:
// <script src="js/management.js"></script>