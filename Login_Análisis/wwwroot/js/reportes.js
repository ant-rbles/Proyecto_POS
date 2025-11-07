// Funciones para Reportes
function cambiarTipoReporte() {
    actualizarBotonesReporte();
    // Limpiar resultados al cambiar tipo
    const tableHead = document.getElementById('reporteTableHead');
    const tableBody = document.getElementById('reporteTableBody');
    if (tableHead) tableHead.innerHTML = '';
    if (tableBody) tableBody.innerHTML = '';
}

async function cargarReporte() {
    const tipo = document.getElementById('reporteTipo').value;
    const fechaInicio = document.getElementById('reporteFechaInicio').value;
    const fechaFin = document.getElementById('reporteFechaFin').value;

    try {
        let url = `/api/reportes/${tipo}`;
        const params = new URLSearchParams();

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        if (tipo === 'productos-mas-vendidos') {
            params.append('top', '10');
        }

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (response.ok) {
            const reporte = await response.json();
            renderReporte(tipo, reporte);
        } else {
            showMessage('Error al cargar el reporte', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

function renderReporte(tipo, datos) {
    const thead = document.getElementById('reporteTableHead');
    const tbody = document.getElementById('reporteTableBody');

    if (!thead || !tbody) return;

    switch (tipo) {
        case 'ventas':
            renderReporteVentas(thead, tbody, datos);
            break;
        case 'inventario':
            renderReporteInventario(thead, tbody, datos);
            break;
        case 'productos-mas-vendidos':
            renderReporteProductosMasVendidos(thead, tbody, datos);
            break;
        case 'movimientos':
            renderReporteMovimientos(thead, tbody, datos);
            break;
        case 'compras':
            renderReporteCompras(thead, tbody, datos);
            break;
    }
}

function renderReporteVentas(thead, tbody, datos) {
    thead.innerHTML = `
        <tr>
            <th>Período</th>
            <th>Total Ventas</th>
            <th>Total Ingresos</th>
            <th>Promedio por Venta</th>
        </tr>
    `;

    tbody.innerHTML = `
        <tr>
            <td>Reporte General</td>
            <td>${datos.totalVentas || 0}</td>
            <td>$${(datos.totalIngresos || 0).toFixed(2)}</td>
            <td>$${(datos.promedioVenta || 0).toFixed(2)}</td>
        </tr>
    `;
}

function renderReporteInventario(thead, tbody, datos) {
    thead.innerHTML = `
        <tr>
            <th>Métrica</th>
            <th>Valor</th>
        </tr>
    `;

    tbody.innerHTML = `
        <tr>
            <td>Total Productos</td>
            <td>${datos.totalProductos || 0}</td>
        </tr>
        <tr>
            <td>Valor Total Inventario</td>
            <td>$${(datos.valorTotalInventario || 0).toFixed(2)}</td>
        </tr>
        <tr>
            <td>Productos con Stock Bajo</td>
            <td>${datos.productosStockBajo || 0}</td>
        </tr>
        <tr>
            <td>Productos sin Stock</td>
            <td>${datos.productosStockCritico || 0}</td>
        </tr>
    `;
}

function renderReporteProductosMasVendidos(thead, tbody, datos) {
    thead.innerHTML = `
        <tr>
            <th>Producto</th>
            <th>Cantidad Vendida</th>
            <th>Total Vendido</th>
        </tr>
    `;

    tbody.innerHTML = datos.map(item => `
        <tr>
            <td>${item.productoNombre || 'N/A'}</td>
            <td>${item.cantidadVendida || 0}</td>
            <td>$${(item.totalVendido || 0).toFixed(2)}</td>
        </tr>
    `).join('');
}

function renderReporteMovimientos(thead, tbody, datos) {
    thead.innerHTML = `
        <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Observaciones</th>
        </tr>
    `;

    tbody.innerHTML = datos.map(mov => `
        <tr>
            <td>${new Date(mov.fechaMovimiento).toLocaleDateString()}</td>
            <td>${mov.producto?.nombre || 'N/A'}</td>
            <td>${mov.tipoMovimiento || 'N/A'}</td>
            <td>${mov.cantidad || 0}</td>
            <td>${mov.observaciones || '-'}</td>
        </tr>
    `).join('');
}

function renderReporteCompras(thead, tbody, datos) {
    thead.innerHTML = `
        <tr>
            <th>Factura</th>
            <th>Proveedor</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
        </tr>
    `;

    tbody.innerHTML = datos.map(compra => `
        <tr>
            <td>${compra.numeroFactura || 'N/A'}</td>
            <td>${compra.proveedor?.nombre || 'N/A'}</td>
            <td>${new Date(compra.fechaCompra).toLocaleDateString()}</td>
            <td>$${(compra.total || 0).toFixed(2)}</td>
            <td>${compra.estado || 'N/A'}</td>
        </tr>
    `).join('');
}

async function generarReporteVentas() {
    const fechaInicio = document.getElementById('reporteFechaInicio').value;
    const fechaFin = document.getElementById('reporteFechaFin').value;

    try {
        let url = '/api/reportes/pdf/ventas';
        const params = new URLSearchParams();

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (response.ok) {
            const blob = await response.blob();
            const urlPdf = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = urlPdf;
            a.download = `reporte_ventas_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlPdf);
            showMessage('Reporte descargado exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error al generar el reporte', 'error');
    }
}

// Funciones para descargar reportes adicionales
async function descargarReporteInventarioPdf() {
    try {
        const response = await fetch('/api/reportes/pdf/inventario');
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `reporte_inventario_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showMessage('Reporte de inventario descargado exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error al descargar el reporte', 'error');
    }
}

async function descargarReporteComprasPdf() {
    const fechaInicio = document.getElementById('reporteFechaInicio').value;
    const fechaFin = document.getElementById('reporteFechaFin').value;

    try {
        let url = '/api/reportes/pdf/compras';
        const params = new URLSearchParams();

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        if (response.ok) {
            const blob = await response.blob();
            const urlPdf = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = urlPdf;
            a.download = `reporte_compras_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlPdf);
            showMessage('Reporte de compras descargado exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error al generar el reporte', 'error');
    }
}

// Actualizar la interfaz para incluir botones adicionales
function actualizarBotonesReporte() {
    const tipoReporte = document.getElementById('reporteTipo').value;
    const botonesContainer = document.getElementById('botonesReporteContainer');

    if (!botonesContainer) return;

    let botonesHTML = '';

    if (tipoReporte === 'ventas') {
        botonesHTML = `
            <button class="btn btn-primary" onclick="generarReporteVentas()">
                <i class="fas fa-download"></i> Descargar PDF
            </button>
        `;
    } else if (tipoReporte === 'inventario') {
        botonesHTML = `
            <button class="btn btn-primary" onclick="descargarReporteInventarioPdf()">
                <i class="fas fa-download"></i> Descargar PDF
            </button>
        `;
    } else if (tipoReporte === 'compras') {
        botonesHTML = `
            <button class="btn btn-primary" onclick="descargarReporteComprasPdf()">
                <i class="fas fa-download"></i> Descargar PDF
            </button>
        `;
    } else {
        botonesHTML = `
            <button class="btn btn-primary" onclick="showMessage('Descarga de PDF no disponible para este reporte', 'info')">
                <i class="fas fa-download"></i> Descargar PDF
            </button>
        `;
    }

    botonesContainer.innerHTML = botonesHTML;
}