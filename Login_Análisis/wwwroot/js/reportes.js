// reportes.js - Generación de reportes y estadísticas

// Inicializar módulo de reportes
document.addEventListener('DOMContentLoaded', () => {
    setupReportesEventListeners();
});

function setupReportesEventListeners() {
    // Configurar datepickers con rangos predefinidos
    setupDateRangeFilters();
}

// Configurar filtros de fecha
function setupDateRangeFilters() {
    // Hoy
    document.getElementById('btnHoy')?.addEventListener('click', () => {
        const hoy = new Date();
        setDateRange(hoy, hoy);
    });

    // Esta semana
    document.getElementById('btnEstaSemana')?.addEventListener('click', () => {
        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        setDateRange(inicioSemana, hoy);
    });

    // Este mes
    document.getElementById('btnEsteMes')?.addEventListener('click', () => {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        setDateRange(inicioMes, hoy);
    });

    // Mes anterior
    document.getElementById('btnMesAnterior')?.addEventListener('click', () => {
        const hoy = new Date();
        const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        setDateRange(inicioMesAnterior, finMesAnterior);
    });
}

// Establecer rango de fechas en los inputs
function setDateRange(fechaInicio, fechaFin) {
    const inicioInput = document.getElementById('fechaInicio');
    const finInput = document.getElementById('fechaFin');

    if (inicioInput) {
        inicioInput.value = fechaInicio.toISOString().split('T')[0];
    }
    if (finInput) {
        finInput.value = fechaFin.toISOString().split('T')[0];
    }
}

// Generar reporte de ventas
async function generarReporteVentas() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const tipoReporte = document.getElementById('tipoReporte').value;

    if (!fechaInicio || !fechaFin) {
        showMessage('Seleccione un rango de fechas', 'error');
        return;
    }

    try {
        const reporte = await apiCall(
            `https://localhost:7000/api/reportes/ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&tipoReporte=${tipoReporte}`
        );

        mostrarReporteVentas(reporte);
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showMessage('Error al generar reporte de ventas', 'error');
    }
}

// Mostrar reporte de ventas en la UI
function mostrarReporteVentas(reporte) {
    const container = document.getElementById('reporteContainer');
    if (!container) return;

    let html = `
        <div class="reporte-header">
            <h4><i class="fas fa-chart-bar"></i> Reporte de Ventas</h4>
            <div class="reporte-estadisticas">
                <div class="estadistica-card">
                    <div class="estadistica-valor">${reporte.totalVentas}</div>
                    <div class="estadistica-label">Total Ventas</div>
                </div>
                <div class="estadistica-card">
                    <div class="estadistica-valor">${formatCurrency(reporte.totalIngresos)}</div>
                    <div class="estadistica-label">Ingresos Totales</div>
                </div>
                <div class="estadistica-card">
                    <div class="estadistica-valor">${formatCurrency(reporte.promedioVenta)}</div>
                    <div class="estadistica-label">Promedio por Venta</div>
                </div>
            </div>
        </div>
    `;

    // Ventas por estado
    if (reporte.ventasPorEstado && reporte.ventasPorEstado.length > 0) {
        html += `
            <div class="reporte-seccion">
                <h5>Ventas por Estado</h5>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Estado</th>
                                <th>Cantidad</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        reporte.ventasPorEstado.forEach(estado => {
            const porcentaje = ((estado.cantidad / reporte.totalVentas) * 100).toFixed(1);
            html += `
                <tr>
                    <td>${estado.estado}</td>
                    <td>${estado.cantidad}</td>
                    <td>${porcentaje}%</td>
                </tr>
            `;
        });

        html += `</tbody></table></div></div>`;
    }

    // Ventas por día
    if (reporte.ventasPorDia && reporte.ventasPorDia.length > 0) {
        html += `
            <div class="reporte-seccion">
                <h5>Ventas por Día</h5>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Ventas</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        reporte.ventasPorDia.forEach(dia => {
            html += `
                <tr>
                    <td>${new Date(dia.fecha).toLocaleDateString()}</td>
                    <td>${dia.cantidad}</td>
                    <td>${formatCurrency(dia.total)}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div></div>`;
    }

    container.innerHTML = html;
}

// Generar reporte de inventario
async function generarReporteInventario() {
    try {
        const reporte = await apiCall('https://localhost:7000/api/reportes/inventario');
        mostrarReporteInventario(reporte);
    } catch (error) {
        console.error('Error al generar reporte de inventario:', error);
        showMessage('Error al generar reporte de inventario', 'error');
    }
}

// Mostrar reporte de inventario
function mostrarReporteInventario(reporte) {
    const container = document.getElementById('reporteContainer');
    if (!container) return;

    let html = `
        <div class="reporte-header">
            <h4><i class="fas fa-warehouse"></i> Reporte de Inventario</h4>
            <div class="reporte-estadisticas">
                <div class="estadistica-card">
                    <div class="estadistica-valor">${reporte.totalProductos}</div>
                    <div class="estadistica-label">Total Productos</div>
                </div>
                <div class="estadistica-card">
                    <div class="estadistica-valor">${formatCurrency(reporte.valorTotalInventario)}</div>
                    <div class="estadistica-label">Valor del Inventario</div>
                </div>
                <div class="estadistica-card">
                    <div class="estadistica-valor">${reporte.productosStockBajo}</div>
                    <div class="estadistica-label">Productos con Stock Bajo</div>
                </div>
                <div class="estadistica-card">
                    <div class="estadistica-valor">${reporte.productosStockCritico}</div>
                    <div class="estadistica-label">Productos Sin Stock</div>
                </div>
            </div>
        </div>
    `;

    // Productos por categoría
    if (reporte.productosPorCategoria && reporte.productosPorCategoria.length > 0) {
        html += `
            <div class="reporte-seccion">
                <h5>Productos por Categoría</h5>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Cantidad de Productos</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        reporte.productosPorCategoria.forEach(categoria => {
            const porcentaje = ((categoria.cantidad / reporte.totalProductos) * 100).toFixed(1);
            html += `
                <tr>
                    <td>${categoria.categoria}</td>
                    <td>${categoria.cantidad}</td>
                    <td>${porcentaje}%</td>
                </tr>
            `;
        });

        html += `</tbody></table></div></div>`;
    }

    container.innerHTML = html;
}

// Generar reporte de productos más vendidos
async function generarReporteProductosMasVendidos() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const top = document.getElementById('topProductos').value || 10;

    try {
        const reporte = await apiCall(
            `https://localhost:7000/api/reportes/productos-mas-vendidos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&top=${top}`
        );

        mostrarReporteProductosMasVendidos(reporte);
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showMessage('Error al generar reporte de productos más vendidos', 'error');
    }
}

// Mostrar reporte de productos más vendidos
function mostrarReporteProductosMasVendidos(reporte) {
    const container = document.getElementById('reporteContainer');
    if (!container) return;

    let html = `
        <div class="reporte-header">
            <h4><i class="fas fa-star"></i> Productos Más Vendidos</h4>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Producto</th>
                        <th>Cantidad Vendida</th>
                        <th>Total Vendido</th>
                        <th>Promedio por Unidad</th>
                    </tr>
                </thead>
                <tbody>
    `;

    reporte.forEach((producto, index) => {
        const promedio = producto.totalVendido / producto.cantidadVendida;
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${producto.productoNombre}</td>
                <td>${producto.cantidadVendida.toFixed(2)}</td>
                <td>${formatCurrency(producto.totalVendido)}</td>
                <td>${formatCurrency(promedio)}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// Generar reporte de movimientos de inventario
async function generarReporteMovimientos() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const tipoMovimiento = document.getElementById('tipoMovimiento').value;

    try {
        const reporte = await apiCall(
            `https://localhost:7000/api/reportes/movimientos-inventario?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&tipoMovimiento=${tipoMovimiento}`
        );

        mostrarReporteMovimientos(reporte);
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showMessage('Error al generar reporte de movimientos', 'error');
    }
}

// Mostrar reporte de movimientos
function mostrarReporteMovimientos(reporte) {
    const container = document.getElementById('reporteContainer');
    if (!container) return;

    let html = `
        <div class="reporte-header">
            <h4><i class="fas fa-exchange-alt"></i> Reporte de Movimientos de Inventario</h4>
            <div class="reporte-estadisticas">
                <div class="estadistica-card">
                    <div class="estadistica-valor">${reporte.totalMovimientos}</div>
                    <div class="estadistica-label">Total Movimientos</div>
                </div>
            </div>
        </div>
    `;

    // Movimientos por tipo
    if (reporte.movimientosPorTipo && reporte.movimientosPorTipo.length > 0) {
        html += `
            <div class="reporte-seccion">
                <h5>Movimientos por Tipo</h5>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Cantidad</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        reporte.movimientosPorTipo.forEach(tipo => {
            const porcentaje = ((tipo.cantidad / reporte.totalMovimientos) * 100).toFixed(1);
            html += `
                <tr>
                    <td>${tipo.tipo}</td>
                    <td>${tipo.cantidad}</td>
                    <td>${porcentaje}%</td>
                </tr>
            `;
        });

        html += `</tbody></table></div></div>`;
    }

    container.innerHTML = html;
}

// Descargar reporte en PDF
async function descargarReportePDF(tipoReporte) {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;

    if (!fechaInicio || !fechaFin) {
        showMessage('Seleccione un rango de fechas', 'error');
        return;
    }

    try {
        let url;
        switch (tipoReporte) {
            case 'ventas':
                url = `https://localhost:7000/api/reportes/pdf/ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
                break;
            case 'inventario':
                url = 'https://localhost:7000/api/reportes/pdf/inventario';
                break;
            case 'compras':
                // Asumiendo que tienes un endpoint para reportes de compras en PDF
                url = `https://localhost:7000/api/reportes/pdf/compras?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
                break;
            default:
                showMessage('Tipo de reporte no válido', 'error');
                return;
        }

        // Crear enlace de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${tipoReporte}_${fechaInicio}_${fechaFin}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showMessage('Reporte PDF generado exitosamente', 'success');
    } catch (error) {
        console.error('Error al descargar PDF:', error);
        showMessage('Error al generar el reporte PDF', 'error');
    }
}

// Obtener estadísticas rápidas para el dashboard
async function obtenerEstadisticasRapidas() {
    try {
        const estadisticas = await apiCall('https://localhost:7000/api/ventas/estadisticas');
        mostrarEstadisticasRapidas(estadisticas);
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Mostrar estadísticas rápidas en el dashboard
function mostrarEstadisticasRapidas(estadisticas) {
    const container = document.getElementById('estadisticasRapidas');
    if (!container) return;

    container.innerHTML = `
        <div class="estadisticas-grid">
            <div class="estadistica-rapida">
                <div class="estadistica-icono" style="background: #4e73df;">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <div class="estadistica-contenido">
                    <div class="estadistica-valor">${estadisticas.ventasHoy}</div>
                    <div class="estadistica-label">Ventas Hoy</div>
                </div>
            </div>
            <div class="estadistica-rapida">
                <div class="estadistica-icono" style="background: #1cc88a;">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="estadistica-contenido">
                    <div class="estadistica-valor">${formatCurrency(estadisticas.ingresosHoy)}</div>
                    <div class="estadistica-label">Ingresos Hoy</div>
                </div>
            </div>
            <div class="estadistica-rapida">
                <div class="estadistica-icono" style="background: #36b9cc;">
                    <i class="fas fa-calendar"></i>
                </div>
                <div class="estadistica-contenido">
                    <div class="estadistica-valor">${estadisticas.ventasMes}</div>
                    <div class="estadistica-label">Ventas Este Mes</div>
                </div>
            </div>
            <div class="estadistica-rapida">
                <div class="estadistica-icono" style="background: #f6c23e;">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="estadistica-contenido">
                    <div class="estadistica-valor">${formatCurrency(estadisticas.ingresosMes)}</div>
                    <div class="estadistica-label">Ingresos Este Mes</div>
                </div>
            </div>
        </div>
    `;
}

// Inicializar estadísticas cuando se carga el dashboard
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Cargar estadísticas rápidas después de un pequeño delay
        setTimeout(obtenerEstadisticasRapidas, 1000);
    });
}

// Exportar datos a Excel (simulado - en un caso real usarías una librería como SheetJS)
function exportarAExcel(tipoDatos) {
    showMessage('Función de exportación a Excel en desarrollo', 'info');
    // En una implementación real, aquí usarías una librería como SheetJS
    // para generar y descargar un archivo Excel con los datos
}

// Generar reporte de compras
async function generarReporteCompras() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;

    try {
        const reporte = await apiCall(
            `https://localhost:7000/api/reportes/compras?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
        );

        mostrarReporteCompras(reporte);
    } catch (error) {
        console.error('Error al generar reporte de compras:', error);
        showMessage('Error al generar reporte de compras', 'error');
    }
}

// Mostrar reporte de compras
function mostrarReporteCompras(reporte) {
    const container = document.getElementById('reporteContainer');
    if (!container) return;

    let html = `
        <div class="reporte-header">
            <h4><i class="fas fa-shopping-basket"></i> Reporte de Compras</h4>
            <div class="reporte-estadisticas">
                <div class="estadistica-card">
                    <div class="estadistica-valor">${reporte.totalCompras}</div>
                    <div class="estadistica-label">Total Compras</div>
                </div>
                <div class="estadistica-card">
                    <div class="estadistica-valor">${formatCurrency(reporte.totalInvertido)}</div>
                    <div class="estadistica-label">Total Invertido</div>
                </div>
            </div>
        </div>
    `;

    // Compras por proveedor
    if (reporte.comprasPorProveedor && reporte.comprasPorProveedor.length > 0) {
        html += `
            <div class="reporte-seccion">
                <h5>Compras por Proveedor</h5>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Proveedor</th>
                                <th>Cantidad de Compras</th>
                                <th>Total Invertido</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        reporte.comprasPorProveedor.forEach(proveedor => {
            html += `
                <tr>
                    <td>${proveedor.proveedor}</td>
                    <td>${proveedor.cantidad}</td>
                    <td>${formatCurrency(proveedor.total)}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div></div>`;
    }

    container.innerHTML = html;
}