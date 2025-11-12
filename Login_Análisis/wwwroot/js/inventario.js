let inventarioData = [];
let totalValorInventario = 0;
let proveedoresData = [];

// 🔹 Cargar inventario y proveedores
async function loadInventario() {
    try {
        mostrarCargando();

        const authToken = localStorage.getItem('authToken');

        // 🔹 Cargar proveedores
        const responseProv = await fetch('https://localhost:7000/api/proveedores', {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
        if (responseProv.ok) {
            proveedoresData = await responseProv.json();
            cargarProveedoresEnFiltro();
        } else {
            console.warn("⚠️ No se pudieron cargar proveedores para el filtro.");
        }

        // 🔹 Cargar inventario detallado
        const response = await fetch('https://localhost:7000/api/reportes/inventario/detallado', {
            method: 'GET',
            headers: {
                'Authorization': authToken ? `Bearer ${authToken}` : '',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            mostrarMensaje('Error al cargar el inventario', 'error');
            return;
        }

        // ✅ Aquí sí definimos result correctamente
        const result = await response.json();
        console.log("📦 Respuesta del backend (inventario):", result);

        // ✅ Tomar correctamente la lista de productos del JSON del backend
        inventarioData = Array.isArray(result.productos)
            ? result.productos
            : (Array.isArray(result.inventarioDetallado)
                ? result.inventarioDetallado
                : (Array.isArray(result) ? result : [])
            );

        // ✅ Si no hay productos, salir sin error
        if (!Array.isArray(inventarioData) || inventarioData.length === 0) {
            console.warn("Inventario vacío o sin datos válidos.");
            renderizarTablaInventario([]);
            calcularEstadisticasInventario([]);
            actualizarResumenInventario();
            return;
        }

        // ✅ Calcular totales
        totalValorInventario = inventarioData.reduce(
            (sum, p) => sum + ((parseFloat(p.precioCostoPromedio) || 0) * (parseFloat(p.stockActual) || 0)),
            0
        );

        // ✅ Renderizar y mostrar
        calcularEstadisticasInventario(inventarioData);
        renderizarTablaInventario(inventarioData);
        actualizarResumenInventario();

    } catch (error) {
        console.error('❌ Error al cargar inventario:', error);
        mostrarMensaje('Error de conexión al cargar el inventario', 'error');
    }
}

// 🔹 Calcular totales y estadísticas
function calcularEstadisticasInventario(productos) {
    // productos debe ser siempre un array (ver loadInventario)
    const totalProductos = Array.isArray(productos) ? productos.length : 0;
    const valorTotal = Array.isArray(productos)
        ? productos.reduce(
            (sum, p) => sum + ((parseFloat(p.precioCostoPromedio) || 0) * (parseFloat(p.stockActual) || 0)),
            0
        )
        : 0;

    // Actualiza elementos DOM que existan (asegúrate que los IDs coincidan)
    const elTotal = document.getElementById('totalProductos');
    if (elTotal) elTotal.textContent = totalProductos;

    const elValor = document.getElementById('valorTotalInventario') || document.getElementById('valorTotal'); // tolerancia
    if (elValor) elValor.textContent = `Q ${valorTotal.toFixed(2)}`;
}

// 🔹 Actualizar resumen superior (cards)
function actualizarResumenInventario() {
    const productosConStockBajo = inventarioData.filter(p => (parseFloat(p.stockActual) || 0) > 0 && (parseFloat(p.stockActual) || 0) <= (parseFloat(p.stockMinimo) || 0)).length;
    const productosSinStock = inventarioData.filter(p => (parseFloat(p.stockActual) || 0) === 0).length;

    const totalEl = document.getElementById('totalProductos');
    if (totalEl) totalEl.textContent = inventarioData.length;

    const valorEl = document.getElementById('valorTotalInventario');
    if (valorEl) valorEl.textContent = `Q ${totalValorInventario.toFixed(2)}`;

    const bajoEl = document.getElementById('productosStockBajo');
    if (bajoEl) bajoEl.textContent = productosConStockBajo;

    const sinEl = document.getElementById('productosSinStock');
    if (sinEl) sinEl.textContent = productosSinStock;
}

// 🔹 Renderizar tabla
function renderizarTablaInventario(datos = inventarioData) {
    const tbody = document.getElementById('inventarioTableBody');
    if (!tbody) return;

    if (!datos || datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="no-data">No hay productos en el inventario</td></tr>';
        return;
    }

    console.log("Ejemplo de producto en inventario:", JSON.stringify(datos[0], null, 2));

    tbody.innerHTML = datos.map(producto => {
        // normalizar campos (tolerancia a diferentes nombres)
        const id = producto.id ?? producto.Id ?? producto.productoId ?? producto.ProductoId ?? 0;
        const codigo = producto.codigo ?? producto.Codigo ?? '';
        const nombre = producto.nombre ?? producto.Nombre ?? '';
        const descripcion = producto.descripcion ?? producto.Descripcion ?? '';
        const stockActual = parseFloat(producto.stockActual ?? producto.StockActual ?? 0);
        const stockMinimo = parseFloat(producto.stockMinimo ?? producto.StockMinimo ?? 0);
        const precioCosto = parseFloat(producto.precioCostoPromedio ?? producto.PrecioCostoPromedio ?? producto.precioCosto ?? producto.PrecioCosto ?? 0);
        const precioVenta = parseFloat(producto.precioVenta ?? producto.PrecioVenta ?? 0);

        // proveedor: si backend ya incluye nombre directo, úsalo; si no, buscar por id en proveedoresData
        const proveedorNombreFromObj = producto.proveedorNombre ?? producto.ProveedorNombre ?? producto.proveedor?.nombre ?? producto.proveedor?.Nombre;
        const proveedorIdFromObj = producto.proveedorId ?? producto.ProveedorId ?? producto.proveedor?.id ?? producto.proveedor?.Id;
        const proveedorNombre = proveedorNombreFromObj
            || obtenerNombreProveedorPorId(proveedorIdFromObj)
            || 'Sin proveedor';

        // categoría (tolerancia)
        const categoriaNombre = producto.categoriaNombre ?? producto.CategoriaNombre ?? producto.categoria?.nombre ?? producto.categoria?.Nombre ?? 'Sin categoría';

        // unidad de medida: intentar varios campos (unidadMedidaBase, unidad, unidadMedida)
        const unidadNombre = producto.unidadMedidaBase?.nombre
            ?? producto.unidadMedidaBase?.Nombre
            ?? producto.unidad?.nombre
            ?? producto.unidad?.Nombre
            ?? producto.unidadMedida?.nombre
            ?? producto.unidadMedida?.Nombre
            ?? producto.unidad ?? producto.Unidad ?? 'N/A';

        const valorInventario = (stockActual || 0) * (precioCosto || 0);
        const estado = obtenerEstadoStock({ stockActual, stockMinimo });

        return `
            <tr>
                <td><strong>${codigo}</strong></td>
                <td>
                    <div style="font-weight: 500;">${nombre}</div>
                    ${descripcion ? `<small class="text-muted" style="display:block;margin-top:4px;">${descripcion}</small>` : ''}
                </td>
                <td>${proveedorNombre}</td>
                <td>${categoriaNombre}</td>
                <td class="text-center">${unidadNombre}</td>
                <td class="text-center">${stockActual.toFixed(2)}</td>
                <td class="text-center">${stockMinimo.toFixed(2)}</td>
                <td class="text-right">Q ${precioCosto.toFixed(2)}</td>
                <td class="text-right">Q ${precioVenta.toFixed(2)}</td>
                <td class="text-right"><strong>Q ${valorInventario.toFixed(2)}</strong></td>
                <td class="text-center"><span class="badge ${estado.clase}">${estado.texto}</span></td>
                <td class="text-center">
                    <button class="action-btn view-btn" onclick="verDetalleProducto(${id})" title="Ver detalle">
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
    const filtroProveedor = document.getElementById('inventarioProveedor')?.value || ''; 

    let datosFiltrados = inventarioData;

    // Filtrar por texto (nombre o código)
    if (filtroTexto) {
        datosFiltrados = datosFiltrados.filter(p =>
            (p.codigo ?? '').toString().toLowerCase().includes(filtroTexto) ||
            (p.nombre ?? '').toString().toLowerCase().includes(filtroTexto)
        );
    }

    // Filtrar por estado del stock
    if (filtroEstado) {
        datosFiltrados = datosFiltrados.filter(p => {
            if (filtroEstado === 'agotado') return p.stockActual === 0;
            if (filtroEstado === 'bajo') return p.stockActual <= p.stockMinimo && p.stockActual > 0;
            if (filtroEstado === 'normal') return p.stockActual > p.stockMinimo;
            return true;
        });
    }

    // ✅ Filtrar por proveedor
    if (filtroProveedor) {
        datosFiltrados = datosFiltrados.filter(p => {
            const provId = p.proveedorId ?? p.ProveedorId ?? p.proveedorID ?? null;
            return String(provId) === String(filtroProveedor);
        });
    }

    renderizarTablaInventario(datosFiltrados);
}

function cargarProveedoresEnFiltro() {
    const select = document.getElementById('inventarioProveedor');
    if (!select) return;

    select.innerHTML = '<option value="">Todos los proveedores</option>';

    proveedoresData.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id ?? p.Id ?? '';
        option.textContent = p.nombre ?? p.Nombre ?? 'Proveedor sin nombre';
        select.appendChild(option);
    });

    select.addEventListener('change', filtrarInventario);
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
        // usar endpoint que ya tienes: /api/productos/{id}
        const response = await fetch(`https://localhost:7000/api/productos/${productoId}`, {
            method: 'GET',
            headers: {
                'Authorization': authToken ? `Bearer ${authToken}` : ''
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
    // normalizar campos del producto
    const codigo = producto.codigo ?? producto.Codigo ?? '';
    const nombre = producto.nombre ?? producto.Nombre ?? '';
    const descripcion = producto.descripcion ?? producto.Descripcion ?? 'N/A';
    const categoria = producto.categoria?.nombre ?? producto.categoria?.Nombre ?? producto.categoriaNombre ?? producto.CategoriaNombre ?? 'N/A';
    const unidad = producto.unidadMedidaBase?.nombre ?? producto.unidad?.nombre ?? producto.unidad ?? 'N/A';
    const stockActual = parseFloat(producto.stockActual ?? producto.StockActual ?? 0);
    const stockMinimo = parseFloat(producto.stockMinimo ?? producto.StockMinimo ?? 0);
    const precioCosto = parseFloat(producto.precioCostoPromedio ?? producto.PrecioCostoPromedio ?? producto.precioCosto ?? 0);
    const precioVenta = parseFloat(producto.precioVenta ?? producto.PrecioVenta ?? 0);

    const valorInventario = (stockActual || 0) * (precioCosto || 0);
    const estado = obtenerEstadoStock({ stockActual, stockMinimo });

    const modalHTML = `
        <div class="modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000;">
            <div style="background:white; padding:20px; border-radius:8px; width:600px; max-width:95%;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="margin:0; color:#4e73df;">Detalle del Producto</h3>
                    <button onclick="cerrarModal()" style="background:none; border:none; font-size:20px; cursor:pointer;">×</button>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div>
                        <p><strong>Código:</strong> ${codigo}</p>
                        <p><strong>Nombre:</strong> ${nombre}</p>
                        <p><strong>Descripción:</strong> ${descripcion}</p>
                        <p><strong>Categoría:</strong> ${categoria}</p>
                    </div>
                    <div>
                        <p><strong>Unidad:</strong> ${unidad}</p>
                        <p><strong>Stock Actual:</strong> ${stockActual.toFixed(2)}</p>
                        <p><strong>Stock Mínimo:</strong> ${stockMinimo.toFixed(2)}</p>
                        <p><strong>Estado:</strong> <span class="badge ${estado.clase}">${estado.texto}</span></p>
                    </div>
                </div>

                <div style="margin-top:20px; padding:15px; background:#f8f9fa; border-radius:5px;">
                    <p><strong>Precio Costo:</strong> Q ${precioCosto.toFixed(2)}</p>
                    <p><strong>Precio Venta:</strong> Q ${precioVenta.toFixed(2)}</p>
                    <p><strong>Valor en Inventario:</strong> <strong>Q ${valorInventario.toFixed(2)}</strong></p>
                </div>

                <div style="margin-top:20px; text-align:right;">
                    <button class="btn btn-secondary" onclick="cerrarModal()">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    const modalExistente = document.getElementById('modalDetalleProducto');
    if (modalExistente) modalExistente.remove();

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