let inventarioData = [];
let totalValorInventario = 0;
let proveedoresData = [];

async function loadInventario() {
    try {
        mostrarCargando();

        const authToken = localStorage.getItem('authToken');

        const responseProv = await fetch('https://localhost:7000/api/proveedores', {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
        if (responseProv.ok) {
            proveedoresData = await responseProv.json();
            cargarProveedoresEnFiltro();
        } else {
            console.warn("No se pudieron cargar proveedores para el filtro.");
        }

        const response = await fetch('https://localhost:7000/api/productos/todos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            inventarioData = await response.json();
            calcularEstadisticasInventario();
            renderizarTablaInventario();
            actualizarResumenInventario();
        } else {
            mostrarMensaje('Error al cargar el inventario', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    }
}

function calcularEstadisticasInventario() {
    totalValorInventario = inventarioData.reduce((total, producto) => {
        return total + (producto.stockActual * producto.precioCostoPromedio);
    }, 0);
}

function actualizarResumenInventario() {
    const productosConStockBajo = inventarioData.filter(p => p.stockActual <= p.stockMinimo && p.stockActual > 0).length;
    const productosSinStock = inventarioData.filter(p => p.stockActual === 0).length;

    document.getElementById('totalProductos').textContent = inventarioData.length;
    document.getElementById('valorTotalInventario').textContent = `Q ${totalValorInventario.toFixed(2)}`;
    document.getElementById('productosStockBajo').textContent = productosConStockBajo;
    document.getElementById('productosSinStock').textContent = productosSinStock;
}

function renderizarTablaInventario(datos = inventarioData) {
    const tbody = document.getElementById('inventarioTableBody');
    if (!tbody) return;

    if (!datos || datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="no-data">No hay productos en el inventario</td></tr>';
        return;
    }

    // LOG para inspección rápida en consola
    console.log('Renderizando inventario. Productos:', datos.length, 'Proveedores cargados:', proveedoresData.length);

    tbody.innerHTML = datos.map(producto => {
        const valorInventario = (producto.stockActual || 0) * (producto.precioCostoPromedio || 0);
        const estado = obtenerEstadoStock(producto);

        // Resolución de nombre de proveedor tolerante
        const proveedorNombre =
            (producto.proveedor && (producto.proveedor.nombre || producto.proveedor.Nombre)) ||
            (producto.Proveedor && (producto.Proveedor.nombre || producto.Proveedor.Nombre)) ||
            obtenerNombreProveedorPorId(producto.proveedorId ?? producto.ProveedorId ?? producto.proveedorID);

        return `
            <tr>
                <td><strong>${producto.codigo ?? ''}</strong></td>
                <td>
                    <div style="font-weight: 500;">${producto.nombre ?? ''}</div>
                    ${producto.descripcion ? `<small class="text-muted" style="display: block; margin-top: 4px;">${producto.descripcion}</small>` : ''}
                </td>
                <td>${producto.categoria ? (producto.categoria.nombre ?? producto.categoria.Nombre) : '-'}</td>
                <td>${proveedorNombre || 'Sin proveedor'}</td>
                <td class="text-center">${producto.unidadMedidaBase ? (producto.unidadMedidaBase.abreviatura ?? producto.unidadMedidaBase.Abreviatura) : 'N/A'}</td>
                <td class="text-center">${(producto.stockActual ?? 0).toFixed(2)}</td>
                <td class="text-center">${(producto.stockMinimo ?? 0).toFixed(2)}</td>
                <td class="text-right">Q ${(producto.precioCostoPromedio ?? 0).toFixed(2)}</td>
                <td class="text-right">Q ${(producto.precioVenta ?? 0).toFixed(2)}</td>
                <td class="text-right"><strong>Q ${valorInventario.toFixed(2)}</strong></td>
                <td class="text-center">
                    <span class="badge ${estado.clase}">${estado.texto}</span>
                </td>
                <td class="text-center">
                    <button class="action-btn view-btn" onclick="verDetalleProducto(${producto.id})" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function obtenerNombreProveedorPorId(id) {
    if (id === null || id === undefined) return 'Sin proveedor';

    // Asegurar que proveedoresData está disponible
    if (!Array.isArray(proveedoresData) || proveedoresData.length === 0) {
        console.warn('proveedoresData vacío o no cargado aún');
        return 'Sin proveedor';
    }

    // Normalizar a número si es posible
    const idNum = (typeof id === 'string') ? parseInt(id, 10) : id;

    // Buscar por múltiples posibles propiedades
    const prov = proveedoresData.find(p => {
        const pid = p.id ?? p.Id ?? p.proveedorId ?? p.ProveedorId;
        // intentar comparar como número y como string
        if (pid === undefined || pid === null) return false;
        return Number(pid) === Number(idNum) || String(pid) === String(id);
    });

    return prov ? (prov.nombre ?? prov.Nombre ?? 'Sin proveedor') : 'Sin proveedor';
}

function obtenerEstadoStock(producto) {
    if (producto.stockActual === 0) {
        return { texto: 'Agotado', clase: 'badge-danger' };
    } else if (producto.stockActual <= producto.stockMinimo) {
        return { texto: 'Stock Bajo', clase: 'badge-warning' };
    } else {
        return { texto: 'Normal', clase: 'badge-success' };
    }
}

function filtrarInventario() {
    const filtroTexto = document.getElementById('filtroInventario')?.value.toLowerCase() || '';
    const filtroEstado = document.getElementById('filtroEstado')?.value || '';
    const filtroProveedor = document.getElementById('filtroProveedorInventario')?.value || '';

    let datosFiltrados = inventarioData;

    if (filtroTexto) {
        datosFiltrados = datosFiltrados.filter(p =>
            (p.codigo ?? '').toString().toLowerCase().includes(filtroTexto) ||
            (p.nombre ?? '').toString().toLowerCase().includes(filtroTexto)
        );
    }

    if (filtroEstado) {
        datosFiltrados = datosFiltrados.filter(p => {
            if (filtroEstado === 'normal') return (p.stockActual ?? 0) > (p.stockMinimo ?? 0);
            if (filtroEstado === 'bajo') return (p.stockActual ?? 0) <= (p.stockMinimo ?? 0) && (p.stockActual ?? 0) > 0;
            if (filtroEstado === 'agotado') return (p.stockActual ?? 0) === 0;
            return true;
        });
    }

    if (filtroProveedor) {
        const provId = parseInt(filtroProveedor, 10);
        datosFiltrados = datosFiltrados.filter(p => {
            const pid = p.proveedorId ?? p.ProveedorId ?? p.proveedor?.id ?? p.Proveedor?.id;
            return Number(pid) === provId;
        });
    }

    renderizarTablaInventario(datosFiltrados);
}

function cargarProveedoresEnFiltro() {
    const select = document.getElementById('filtroProveedorInventario');
    if (!select) {
        console.warn('No existe #filtroProveedorInventario en el DOM');
        return;
    }

    select.innerHTML = '<option value="">Todos los proveedores</option>';

    if (!Array.isArray(proveedoresData) || proveedoresData.length === 0) {
        console.warn('proveedoresData vacío al intentar llenar el filtro');
        return;
    }

    proveedoresData.forEach(p => {
        const option = document.createElement('option');
        // normalizar id
        const pid = p.id ?? p.Id ?? p.proveedorId ?? p.ProveedorId;
        option.value = pid ?? '';
        option.textContent = p.nombre ?? p.Nombre ?? `Proveedor ${pid}`;
        select.appendChild(option);
    });

    console.log(`✅ Filtro de proveedores cargado (${proveedoresData.length})`, proveedoresData);
}

// Funciones de utilidad
function mostrarCargando() {
    const tbody = document.getElementById('inventarioTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center">
                    <div class="loading-container">
                        <div class="spinner"></div>
                        <span>Cargando inventario...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

function mostrarMensaje(mensaje, tipo) {
    if (typeof showMessage === 'function') {
        showMessage(mensaje, tipo);
    }
}

// Ver detalle del producto (mantenemos esta función)
async function verDetalleProducto(productoId) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/productos/${productoId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const producto = await response.json();
            abrirModalDetalle(producto);
        } else {
            mostrarMensaje('Error al cargar el detalle', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    }
}

function abrirModalDetalle(producto) {
    const valorInventario = producto.stockActual * producto.precioCostoPromedio;
    const estado = obtenerEstadoStock(producto);

    const modalHTML = `
        <div class="modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 20px; border-radius: 8px; width: 500px; max-width: 90%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #4e73df;">Detalle del Producto</h3>
                    <button onclick="cerrarModal()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <p><strong>Código:</strong> ${producto.codigo}</p>
                        <p><strong>Nombre:</strong> ${producto.nombre}</p>
                        <p><strong>Descripción:</strong> ${producto.descripcion || 'N/A'}</p>
                        <p><strong>Categoría:</strong> ${producto.categoria?.nombre || 'N/A'}</p>
                    </div>
                    <div>
                        <p><strong>Unidad:</strong> ${producto.unidadMedidaBase?.nombre || 'N/A'}</p>
                        <p><strong>Stock Actual:</strong> ${producto.stockActual.toFixed(2)}</p>
                        <p><strong>Stock Mínimo:</strong> ${producto.stockMinimo.toFixed(2)}</p>
                        <p><strong>Estado:</strong> <span class="badge ${estado.clase}">${estado.texto}</span></p>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <p><strong>Precio Costo:</strong> Q ${producto.precioCostoPromedio.toFixed(2)}</p>
                    <p><strong>Precio Venta:</strong> Q ${producto.precioVenta.toFixed(2)}</p>
                    <p><strong>Valor en Inventario:</strong> <strong>Q ${valorInventario.toFixed(2)}</strong></p>
                </div>
                
                <div style="margin-top: 20px; text-align: right;">
                    <button class="btn btn-secondary" onclick="cerrarModal()">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    const modalExistente = document.getElementById('modalDetalleProducto');
    if (modalExistente) {
        modalExistente.remove();
    }

    const modalDiv = document.createElement('div');
    modalDiv.id = 'modalDetalleProducto';
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
}

function cerrarModal() {
    const modal = document.getElementById('modalDetalleProducto');
    if (modal) {
        modal.remove();
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('inventarioTableBody')) {
        loadInventario();
    }
});