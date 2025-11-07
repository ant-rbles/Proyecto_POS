// Funciones para Inventario
async function loadInventario() {
    try {
        console.log('Cargando inventario desde la base de datos...');
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/productos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            productos = await response.json();
            console.log('Inventario cargado:', productos);

            // Calcular estadísticas
            const totalProductos = productos.length;
            const totalStock = productos.reduce((sum, p) => sum + (p.stockActual || 0), 0);
            const stockBajo = productos.filter(p => p.stockActual <= (p.stockMinimo || 0) && p.stockActual > 0).length;
            const sinStock = productos.filter(p => p.stockActual <= 0).length;
            const valorInventario = productos.reduce((sum, p) => sum + ((p.stockActual || 0) * (p.precioCostoPromedio || 0)), 0);

            // Actualizar UI
            document.getElementById('totalProductos').textContent = totalProductos;
            document.getElementById('totalStock').textContent = totalStock.toFixed(2);
            document.getElementById('stockBajo').textContent = stockBajo;
            document.getElementById('valorInventario').textContent = `$${valorInventario.toFixed(2)}`;

            // Renderizar tabla de inventario
            renderInventarioTable();
        } else {
            showMessage('Error al cargar el inventario', 'error');
        }
    } catch (error) {
        console.error('Error al cargar inventario:', error);
        showMessage('Error de conexión al cargar inventario', 'error');
    }
}

function renderInventarioTable() {
    const tbody = document.getElementById('inventarioTableBody');
    if (!tbody) {
        console.error('No se encontró el tbody de inventario');
        return;
    }

    if (!productos || productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No hay productos en inventario</td></tr>';
        return;
    }

    tbody.innerHTML = productos.map(producto => {
        const id = producto.id || producto.Id;
        const codigo = producto.codigo || producto.Codigo || 'N/A';
        const nombre = producto.nombre || producto.Nombre || 'N/A';
        const estado = producto.estado !== undefined ? producto.estado : (producto.Estado !== undefined ? producto.Estado : true);

        // Categoría
        let categoriaNombre = 'Sin categoría';
        if (producto.categoria) {
            categoriaNombre = producto.categoria.nombre || producto.categoria.Nombre || 'Sin categoría';
        } else if (producto.Categoria) {
            categoriaNombre = producto.Categoria.nombre || producto.Categoria.Nombre || 'Sin categoría';
        }

        // Unidad de medida
        let unidadNombre = 'N/A';
        if (producto.unidadMedidaBase) {
            unidadNombre = producto.unidadMedidaBase.nombre || producto.unidadMedidaBase.Nombre || 'N/A';
        } else if (producto.UnidadMedidaBase) {
            unidadNombre = producto.UnidadMedidaBase.nombre || producto.UnidadMedidaBase.Nombre || 'N/A';
        }

        // Valores numéricos
        const stockActual = parseFloat(producto.stockActual || producto.StockActual || 0);
        const stockMinimo = parseFloat(producto.stockMinimo || producto.StockMinimo || 0);
        const precioCosto = parseFloat(producto.precioCostoPromedio || producto.PrecioCostoPromedio || 0);
        const precioVenta = parseFloat(producto.precioVenta || producto.PrecioVenta || 0);

        // Calcular valor total en inventario
        const valorTotal = stockActual * precioCosto;

        return `
        <tr>
            <td>${codigo}</td>
            <td>${nombre}</td>
            <td>${categoriaNombre}</td>
            <td>${unidadNombre}</td>
            <td class="text-center">
                <span class="stock-badge ${getStockStatusClass(stockActual, stockMinimo)}">
                    ${stockActual.toFixed(2)}
                </span>
            </td>
            <td class="text-center">${stockMinimo.toFixed(2)}</td>
            <td class="text-right">Q ${precioCosto.toFixed(2)}</td>
            <td class="text-right">Q ${precioVenta.toFixed(2)}</td>
            <td class="text-right">Q ${valorTotal.toFixed(2)}</td>
            <td class="text-center">
                <span class="badge ${estado ? 'badge-success' : 'badge-danger'}">
                    ${estado ? 'Activo' : 'Inactivo'}
                </span>
            </td>
        </tr>
        `;
    }).join('');
}

function getStockStatusClass(stockActual, stockMinimo) {
    if (stockActual <= 0) return 'stock-critical';
    if (stockActual <= stockMinimo) return 'stock-low';
    return 'stock-normal';
}

function getStockStatusText(stockActual, stockMinimo) {
    if (stockActual <= 0) return 'Sin Stock';
    if (stockActual <= stockMinimo) return 'Stock Bajo';
    return 'Normal';
}

// Funciones para Movimientos
function showAjusteForm() {
    console.log('Mostrando formulario de ajuste');
    openManagementTab('movimientos');
    const form = document.getElementById('ajusteForm');
    if (form) {
        form.style.display = 'block';
        cargarProductosParaAjuste();
    }
}

function hideAjusteForm() {
    const form = document.getElementById('ajusteForm');
    if (form) form.style.display = 'none';
    const ajusteFormElement = document.getElementById('ajusteFormElement');
    if (ajusteFormElement) ajusteFormElement.reset();
}

function cargarProductosParaAjuste() {
    const selectAjuste = document.getElementById('ajusteProducto');
    if (selectAjuste) {
        selectAjuste.innerHTML = '<option value="">Seleccionar producto</option>' +
            productos.filter(p => p.estado).map(p =>
                `<option value="${p.id}">${p.nombre} - Stock actual: ${p.stockActual}</option>`
            ).join('');
    }
}

async function handleAjusteSubmit(e) {
    e.preventDefault();

    const ajuste = {
        productoId: parseInt(document.getElementById('ajusteProducto').value),
        cantidad: parseFloat(document.getElementById('ajusteCantidad').value),
        observaciones: document.getElementById('ajusteObservaciones').value,
        usuarioId: JSON.parse(localStorage.getItem('user')).id
    };

    try {
        const response = await fetch('/api/movimientos/ajuste', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ajuste)
        });

        if (response.ok) {
            showMessage('Ajuste aplicado exitosamente', 'success');
            hideAjusteForm();
            cargarMovimientos();
            loadProductos(); // Recargar productos para actualizar stock
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al aplicar el ajuste', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

async function cargarMovimientos() {
    const tipo = document.getElementById('movimientoTipo').value;
    const fechaInicio = document.getElementById('movimientoFechaInicio').value;
    const fechaFin = document.getElementById('movimientoFechaFin').value;

    try {
        let url = '/api/movimientos';
        const params = new URLSearchParams();

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);
        if (tipo) params.append('tipoMovimiento', tipo);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (response.ok) {
            const movimientos = await response.json();
            renderMovimientosTable(movimientos);
        } else {
            showMessage('Error al cargar los movimientos', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

function renderMovimientosTable(movimientos) {
    const tbody = document.getElementById('movimientosTableBody');
    if (!tbody) return;

    tbody.innerHTML = movimientos.map(mov => `
        <tr>
            <td>${new Date(mov.fechaMovimiento).toLocaleString()}</td>
            <td>${mov.producto?.nombre}</td>
            <td>
                <span class="status-badge ${mov.tipoMovimiento === 'ENTRADA' ? 'normal' :
            mov.tipoMovimiento === 'SALIDA' ? 'warning' : 'critical'
        }">
                    ${mov.tipoMovimiento}
                </span>
            </td>
            <td>${mov.cantidad}</td>
            <td>${mov.cantidadAnterior}</td>
            <td>${mov.cantidadNueva}</td>
            <td>${mov.observaciones || '-'}</td>
        </tr>
    `).join('');
}