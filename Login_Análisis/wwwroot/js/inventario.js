// inventario.js - Versión simplificada
let inventarioData = [];
let totalValorInventario = 0;

async function loadInventario() {
    try {
        mostrarCargando();

        const authToken = localStorage.getItem('authToken');
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

function renderizarTablaInventario() {
    const tbody = document.getElementById('inventarioTableBody');
    if (!tbody) return;

    if (!inventarioData || inventarioData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-data">No hay productos en el inventario</td></tr>';
        return;
    }

    tbody.innerHTML = inventarioData.map(producto => {
        const valorInventario = producto.stockActual * producto.precioCostoPromedio;
        const estado = obtenerEstadoStock(producto);

        return `
            <tr>
                <td><strong>${producto.codigo}</strong></td>
                <td>
                    <div style="font-weight: 500;">${producto.nombre}</div>
                    ${producto.descripcion ? `<small class="text-muted" style="display: block; margin-top: 4px;">${producto.descripcion}</small>` : ''}
                </td>
                <td>${producto.categoria ? producto.categoria.nombre : '-'}</td>
                <td class="text-center">${producto.unidadMedidaBase ? producto.unidadMedidaBase.abreviatura : 'N/A'}</td>
                <td class="text-center">${producto.stockActual.toFixed(2)}</td>
                <td class="text-center">${producto.stockMinimo.toFixed(2)}</td>
                <td class="text-right">Q ${producto.precioCostoPromedio.toFixed(2)}</td>
                <td class="text-right">Q ${producto.precioVenta.toFixed(2)}</td>
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
    const filtro = document.getElementById('filtroInventario').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;

    let datosFiltrados = inventarioData;

    if (filtro) {
        datosFiltrados = datosFiltrados.filter(producto =>
            producto.codigo.toLowerCase().includes(filtro) ||
            producto.nombre.toLowerCase().includes(filtro)
        );
    }

    if (estado) {
        datosFiltrados = datosFiltrados.filter(producto => {
            if (estado === 'normal') return producto.stockActual > producto.stockMinimo;
            if (estado === 'bajo') return producto.stockActual <= producto.stockMinimo && producto.stockActual > 0;
            if (estado === 'agotado') return producto.stockActual === 0;
            return true;
        });
    }

    // Re-renderizar la tabla con datos filtrados
    const tbody = document.getElementById('inventarioTableBody');
    tbody.innerHTML = datosFiltrados.map(producto => {
        const valorInventario = producto.stockActual * producto.precioCostoPromedio;
        const estado = obtenerEstadoStock(producto);

        return `
            <tr>
                <td><strong>${producto.codigo}</strong></td>
                <td>
                    <div style="font-weight: 500;">${producto.nombre}</div>
                    ${producto.descripcion ? `<small class="text-muted" style="display: block; margin-top: 4px;">${producto.descripcion}</small>` : ''}
                </td>
                <td>${producto.categoria ? producto.categoria.nombre : '-'}</td>
                <td class="text-center">${producto.unidadMedidaBase ? producto.unidadMedidaBase.abreviatura : 'N/A'}</td>
                <td class="text-center">${producto.stockActual.toFixed(2)}</td>
                <td class="text-center">${producto.stockMinimo.toFixed(2)}</td>
                <td class="text-right">Q ${producto.precioCostoPromedio.toFixed(2)}</td>
                <td class="text-right">Q ${producto.precioVenta.toFixed(2)}</td>
                <td class="text-right"><strong>Q ${valorInventario.toFixed(2)}</strong></td>
                <td class="text-center">
                    <span class="badge ${estado.clase}">${estado.texto}</span>
                </td>
                <td class="text-center">
                    <button class="action-btn view-btn" onclick="verDetalleProducto(${producto.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
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