// inventario.js - Gestión de inventario y movimientos

// Inicializar módulo de inventario
document.addEventListener('DOMContentLoaded', () => {
    setupInventarioEventListeners();
});

function setupInventarioEventListeners() {
    const ajusteForm = document.getElementById('ajusteInventarioForm');
    if (ajusteForm) {
        ajusteForm.addEventListener('submit', handleAjusteInventario);
    }
}

// Cargar inventario
async function loadInventario() {
    try {
        // En un sistema real, aquí cargarías los datos del inventario
        // Por ahora, usaremos los productos ya cargados
        renderInventarioTable();
    } catch (error) {
        console.error('Error al cargar inventario:', error);
        showMessage('Error al cargar inventario', 'error');
    }
}

// Renderizar tabla de inventario
function renderInventarioTable() {
    const tbody = document.getElementById('inventarioTableBody');
    if (!tbody) return;

    if (!productos || productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding: 20px; color: #6c757d;">
                    <i class="fas fa-warehouse" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No hay productos en el inventario
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = productos.map(producto => {
        const estadoStock = getEstadoStock(producto);
        return `
            <tr>
                <td>${producto.codigo}</td>
                <td>${producto.nombre}</td>
                <td>${producto.categoria?.nombre || 'Sin categoría'}</td>
                <td>${producto.stockActual}</td>
                <td>${producto.stockMinimo}</td>
                <td>${formatCurrency(producto.precioCostoPromedio)}</td>
                <td>${formatCurrency(producto.precioVenta)}</td>
                <td>
                    <span class="badge ${estadoStock.clase}">
                        ${estadoStock.texto}
                    </span>
                </td>
                <td>
                    <button class="action-btn view-btn" onclick="verMovimientosProducto(${producto.id})" 
                            title="Ver movimientos">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="mostrarAjusteInventario(${producto.id})" 
                            title="Ajustar inventario">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Determinar estado del stock
function getEstadoStock(producto) {
    if (producto.stockActual === 0) {
        return { texto: 'SIN STOCK', clase: 'badge-danger' };
    } else if (producto.stockActual <= producto.stockMinimo) {
        return { texto: 'STOCK BAJO', clase: 'badge-warning' };
    } else {
        return { texto: 'NORMAL', clase: 'badge-success' };
    }
}

// Mostrar formulario de ajuste de inventario
function mostrarAjusteInventario(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    const modalHTML = `
        <div id="ajusteInventarioModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Ajustar Inventario - ${producto.nombre}</h3>
                    <button class="modal-close" onclick="cerrarModalAjuste()">×</button>
                </div>
                <form id="ajusteInventarioForm">
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Stock Actual</label>
                            <input type="text" class="form-control" value="${producto.stockActual}" disabled>
                        </div>
                        <div class="form-group">
                            <label for="ajusteCantidad">Cantidad de Ajuste *</label>
                            <input type="number" id="ajusteCantidad" class="form-control" step="0.01" required>
                            <small class="text-muted">Use valores positivos para aumentar el stock, negativos para disminuirlo</small>
                        </div>
                        <div class="form-group">
                            <label for="ajusteObservaciones">Observaciones</label>
                            <textarea id="ajusteObservaciones" class="form-control" rows="3" 
                                      placeholder="Motivo del ajuste..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>Nuevo Stock</label>
                            <input type="text" id="nuevoStock" class="form-control" disabled>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="cerrarModalAjuste()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Aplicar Ajuste</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Remover modal existente si hay uno
    const existingModal = document.getElementById('ajusteInventarioModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Calcular nuevo stock en tiempo real
    const cantidadInput = document.getElementById('ajusteCantidad');
    const nuevoStockInput = document.getElementById('nuevoStock');

    cantidadInput.addEventListener('input', () => {
        const ajuste = parseFloat(cantidadInput.value) || 0;
        const nuevoStock = producto.stockActual + ajuste;
        nuevoStockInput.value = nuevoStock;
    });

    // Enfocar el campo de cantidad
    cantidadInput.focus();
}

// Cerrar modal de ajuste
function cerrarModalAjuste() {
    const modal = document.getElementById('ajusteInventarioModal');
    if (modal) {
        modal.remove();
    }
}

// Manejar ajuste de inventario
async function handleAjusteInventario(e) {
    e.preventDefault();

    const cantidadInput = document.getElementById('ajusteCantidad');
    const observacionesInput = document.getElementById('ajusteObservaciones');

    const cantidad = parseFloat(cantidadInput.value);
    const observaciones = observacionesInput.value.trim();

    if (!cantidad) {
        showMessage('La cantidad de ajuste es obligatoria', 'error');
        return;
    }

    // Obtener el producto del modal
    const modal = document.getElementById('ajusteInventarioModal');
    const productoNombre = modal.querySelector('h3').textContent.replace('Ajustar Inventario - ', '');
    const producto = productos.find(p => p.nombre === productoNombre);

    if (!producto) {
        showMessage('Producto no encontrado', 'error');
        return;
    }

    try {
        const submitBtn = modal.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Aplicando...';

        await apiCall('https://localhost:7000/api/movimientos/ajuste', {
            method: 'POST',
            body: JSON.stringify({
                ProductoId: producto.id,
                Cantidad: cantidad,
                Observaciones: observaciones
            })
        });

        showMessage('Ajuste de inventario aplicado exitosamente', 'success');
        cerrarModalAjuste();
        loadProductos(); // Recargar productos para actualizar stock
        loadInventario(); // Recargar vista de inventario

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al aplicar ajuste de inventario', 'error');
    } finally {
        const submitBtn = modal.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

// Ver movimientos de un producto
async function verMovimientosProducto(productoId) {
    try {
        const movimientos = await apiCall(`https://localhost:7000/api/movimientos/producto/${productoId}`);
        mostrarModalMovimientos(movimientos, productoId);
    } catch (error) {
        showMessage('Error al cargar movimientos del producto', 'error');
    }
}

// Mostrar modal con movimientos del producto
function mostrarModalMovimientos(movimientos, productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    const modalHTML = `
        <div id="movimientosProductoModal" class="modal">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h3>Movimientos de Inventario - ${producto.nombre}</h3>
                    <button class="modal-close" onclick="cerrarModalMovimientos()">×</button>
                </div>
                <div class="modal-body">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Cantidad</th>
                                    <th>Stock Anterior</th>
                                    <th>Stock Nuevo</th>
                                    <th>Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${movimientos.length > 0 ? movimientos.map(movimiento => `
                                    <tr>
                                        <td>${new Date(movimiento.fechaMovimiento).toLocaleString()}</td>
                                        <td>
                                            <span class="badge ${getClaseTipoMovimiento(movimiento.tipoMovimiento)}">
                                                ${movimiento.tipoMovimiento}
                                            </span>
                                        </td>
                                        <td>${movimiento.cantidad}</td>
                                        <td>${movimiento.cantidadAnterior}</td>
                                        <td>${movimiento.cantidadNueva}</td>
                                        <td>${movimiento.observaciones || '-'}</td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="6" class="text-center" style="padding: 20px; color: #6c757d;">
                                            No hay movimientos registrados para este producto
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalMovimientos()">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente si hay uno
    const existingModal = document.getElementById('movimientosProductoModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Obtener clase CSS para el tipo de movimiento
function getClaseTipoMovimiento(tipo) {
    switch (tipo) {
        case 'ENTRADA':
        case 'AJUSTE_POSITIVO':
            return 'badge-success';
        case 'SALIDA':
        case 'AJUSTE_NEGATIVO':
            return 'badge-danger';
        default:
            return 'badge-info';
    }
}

// Cerrar modal de movimientos
function cerrarModalMovimientos() {
    const modal = document.getElementById('movimientosProductoModal');
    if (modal) {
        modal.remove();
    }
}