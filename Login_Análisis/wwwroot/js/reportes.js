class ReportesManager {
    constructor() {
        this.currentReportType = 'ventas';
        this.currentFilters = {
            fechaInicio: this.getFirstDayOfMonth(),
            fechaFin: new Date().toISOString().split('T')[0],
            tipoReporte: 'diario',
            top: 10,
            tipoMovimiento: ''
        };
        this.reportData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMetricasRapidas();
        this.cargarReporteVentas();
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('fechaInicio').addEventListener('change', (e) => {
            this.currentFilters.fechaInicio = e.target.value;
            this.actualizarReporte();
        });

        document.getElementById('fechaFin').addEventListener('change', (e) => {
            this.currentFilters.fechaFin = e.target.value;
            this.actualizarReporte();
        });

        document.getElementById('tipoReporte').addEventListener('change', (e) => {
            this.currentFilters.tipoReporte = e.target.value;
            this.actualizarReporte();
        });

        document.getElementById('topProductos').addEventListener('change', (e) => {
            this.currentFilters.top = parseInt(e.target.value);
            this.actualizarReporte();
        });

        document.getElementById('tipoMovimiento').addEventListener('change', (e) => {
            this.currentFilters.tipoMovimiento = e.target.value;
            this.actualizarReporte();
        });

        // Tipos de reporte
        document.querySelectorAll('.tipo-reporte-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tipo = e.currentTarget.dataset.tipo;
                this.cambiarTipoReporte(tipo);
            });
        });

        // Acciones
        document.getElementById('btnAplicarFiltros').addEventListener('click', () => {
            this.actualizarReporte();
        });


        document.getElementById('btnDescargarPDF').addEventListener('click', (e) => {
            const tipo = e.currentTarget.getAttribute('data-tipo') || this.currentReportType;
            this.currentReportType = tipo;
            this.descargarPDF();
        });


        document.getElementById('btnExportarExcel').addEventListener('click', () => {
            this.exportarExcel();
        });
    }

    getFirstDayOfMonth() {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    }

    cambiarTipoReporte(tipo) {
        // Actualizar UI
        document.querySelectorAll('.tipo-reporte-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-tipo="${tipo}"]`).classList.add('active');

        // Actualizar filtros según el tipo
        this.actualizarFiltrosPorTipo(tipo);

        this.currentReportType = tipo;
        this.actualizarReporte();
    }

    actualizarFiltrosPorTipo(tipo) {
        const filtrosMovimiento = document.getElementById('filtroMovimiento');
        const filtroTopProductos = document.getElementById('filtroTopProductos');
        const filtroTipoReporte = document.getElementById('filtroTipoReporte');

        // Ocultar todos primero
        filtrosMovimiento.style.display = 'none';
        filtroTopProductos.style.display = 'none';
        filtroTipoReporte.style.display = 'none';

        switch (tipo) {
            case 'ventas':
                filtroTipoReporte.style.display = 'block';
                break;
            case 'productos-mas-vendidos':
                filtroTopProductos.style.display = 'block';
                break;
            case 'movimientos':
                filtrosMovimiento.style.display = 'block';
                break;
        }
    }

    async actualizarReporte() {
        this.mostrarLoading();

        try {
            switch (this.currentReportType) {
                case 'ventas':
                    await this.cargarReporteVentas();
                    break;
                case 'inventario':
                    await this.cargarReporteInventario();
                    break;
                case 'compras':
                    await this.cargarReporteCompras();
                    break;
                case 'productos-mas-vendidos':
                    await this.cargarProductosMasVendidos();
                    break;
                case 'movimientos':
                    await this.cargarMovimientosInventario();
                    break;
            }
        } catch (error) {
            this.mostrarError('Error al cargar el reporte: ' + error.message);
        }
    }

    async cargarReporteVentas() {
        const params = new URLSearchParams({
            fechaInicio: this.currentFilters.fechaInicio,
            fechaFin: this.currentFilters.fechaFin,
            tipoReporte: this.currentFilters.tipoReporte
        });

        const response = await fetch(`/api/reportes/ventas?${params}`);
        const data = await response.json();

        this.mostrarResultadosVentas(data);
    }

    async cargarReporteInventario() {
        const response = await fetch('/api/reportes/inventario/detallado');
        const data = await response.json();

        const productos = data.productos || [];

        const resultado = {
            totalProductos: data.totalProductos || productos.length,
            valorTotalInventario: data.valorTotalInventario || 0,
            productosStockBajo: data.productosStockBajo || 0,
            productosStockCritico: data.productosStockCritico || 0,
            productos
        };

        this.mostrarResultadosInventario(resultado);
    }

    async cargarReporteCompras() {
        const params = new URLSearchParams({
            fechaInicio: this.currentFilters.fechaInicio,
            fechaFin: this.currentFilters.fechaFin
        });

        const response = await fetch(`/api/reportes/compras?${params}`);
        const data = await response.json();

        this.mostrarResultadosCompras(data);
    }

    async cargarProductosMasVendidos() {
        const params = new URLSearchParams({
            fechaInicio: this.currentFilters.fechaInicio,
            fechaFin: this.currentFilters.fechaFin,
            top: this.currentFilters.top
        });

        const response = await fetch(`/api/reportes/productos-mas-vendidos?${params}`);
        const data = await response.json();

        this.mostrarProductosMasVendidos(data);
    }

    async cargarMovimientosInventario() {
        const params = new URLSearchParams({
            fechaInicio: this.currentFilters.fechaInicio,
            fechaFin: this.currentFilters.fechaFin,
            tipoMovimiento: this.currentFilters.tipoMovimiento
        });

        const response = await fetch(`/api/reportes/movimientos-inventario?${params}`);
        const data = await response.json();

        this.mostrarMovimientosInventario(data);
    }

    async loadMetricasRapidas() {
        try {
            const params = new URLSearchParams({
                fechaInicio: this.getFirstDayOfMonth(),
                fechaFin: new Date().toISOString().split('T')[0]
            });

            const [ventasResponse, inventarioResponse, comprasResponse, productosTopResponse] = await Promise.all([
                fetch(`/api/ventas/estadisticas?${params}`),
                fetch('/api/reportes/inventario'),
                fetch(`/api/reportes/compras?${params}`),
                fetch(`/api/reportes/productos-mas-vendidos?${params}`)
            ]);

            const ventasData = await ventasResponse.json();
            const inventarioData = await inventarioResponse.json();
            const comprasData = await comprasResponse.json();
            const productosTopData = await productosTopResponse.json();

            this.actualizarMetricasRapidas(ventasData, inventarioData, comprasData, productosTopData);
        } catch (error) {
            console.error('Error cargando métricas rápidas:', error);
        }
    }

    actualizarMetricasRapidas(ventasData, inventarioData, comprasData, productosTopData) {
        // Actualizar tarjeta de ventas
        document.getElementById('metricasVentas').textContent = ventasData.ventasMes || 0;
        document.getElementById('metricasIngresos').textContent = this.formatearMoneda(ventasData.ingresosMes || 0);

        // Actualizar tarjeta de inventario
        document.getElementById('metricasTotalProductos').textContent = inventarioData.totalProductos || 0;
        document.getElementById('metricasStockBajo').textContent = inventarioData.productosStockBajo || 0;

        // Actualizar tarjeta de compras 
        document.getElementById('metricasTotalCompras').textContent = comprasData.totalCompras || 0;
        document.getElementById('metricasInversion').textContent = this.formatearMoneda(comprasData.totalInvertido || 0);

        // Actualizar tarjeta de productos más vendidos
        if (Array.isArray(productosTopData) && productosTopData.length > 0) {
            const top = productosTopData[0]; // el más vendido
            document.getElementById('metricasProductosTop').textContent = top.productoNombre || 'N/A';
        } else {
            document.getElementById('metricasProductosTop').textContent = '--';
        }
    }

    // Métodos para mostrar resultados de cada tipo de reporte
    mostrarResultadosVentas(data) {
        const container = document.getElementById('resultadosReporte');

        let html = `
        <div class="resultados-header">
            <h3 class="resultados-title">
                <i class="fas fa-chart-line"></i>
                Reporte de Ventas
            </h3>
            <div class="acciones-reporte">
                <button class="btn btn-primary" onclick="reportesManager.descargarPDF()">
                    <i class="fas fa-download"></i> Descargar PDF
                </button>
            </div>
        </div>

        <div class="resumen-totales">
            <div class="total-row">
                <span>Total Ventas:</span>
                <span><strong>${data.totalVentas || 0}</strong></span>
            </div>
            <div class="total-row">
                <span>Total Ingresos:</span>
                <span><strong>${this.formatearMoneda(data.totalIngresos || 0)}</strong></span>
            </div>
            <div class="total-row">
                <span>Promedio por Venta:</span>
                <span><strong>${this.formatearMoneda(data.promedioVenta || 0)}</strong></span>
            </div>
        </div>

        <div class="grafico-container">
            <canvas id="graficoVentasDia"></canvas>
        </div>
    `;

        // Ventas por estado
        if (data.ventasPorEstado) {
            html += `<h4>Ventas por Estado</h4>`;
            html += this.generarTablaVentasPorEstado(data.ventasPorEstado);
        }

        // Ventas por día
        if (data.ventasPorDia) {
            html += `<h4>Ventas por Día</h4>`;
            html += this.generarTablaVentasPorDia(data.ventasPorDia);
        }

        // INSERTAR TODO EL HTML AQUÍ
        container.innerHTML = html;
        this.ocultarLoading();

        // ✅ AHORA QUE EL DOM EXISTE, GENERAR EL GRÁFICO
        if (data.ventasPorDia) {
            setTimeout(() => {
                this.renderGraficoVentasPorDia(data.ventasPorDia);
            }, 50);
        }
    }


    renderGraficoVentasPorDia(datos) {
        const ctx = document.getElementById('graficoVentasDia');

        if (!ctx) return; // seguridad

        const labels = datos.map(d => d.fecha);
        const values = datos.map(d => d.totalVendido);

        // Crear degradado bonito
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(86, 76, 250, 0.6)');
        gradient.addColorStop(1, 'rgba(134, 70, 255, 0)');

        // Destruir gráfico previo si existe
        if (this.chartVentasDia) {
            this.chartVentasDia.destroy();
        }

        this.chartVentasDia = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Vendido (Q)',
                    data: values,
                    borderColor: '#564CFA',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#564CFA',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#555' }
                    },
                    x: {
                        ticks: { color: '#555' }
                    }
                }
            }
        });
    }

    generarTablaVentasPorDia(ventasPorDia) {
        let html = `
        <div class="table-responsive">
            <table class="tabla-reporte">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Cantidad de Ventas</th>
                        <th>Total Vendido</th>
                        <th>Promedio por Venta</th>
                    </tr>
                </thead>
                <tbody>
    `;

        ventasPorDia.forEach(item => {
            const promedio = item.totalVendido > 0 && item.cantidad > 0
                ? item.totalVendido / item.cantidad
                : 0;

            html += `
            <tr>
                <td>${item.fecha || '-'}</td>
                <td class="text-right">${item.cantidad || 0}</td>
                <td class="text-right">${this.formatearMoneda(item.totalVendido || 0)}</td>
                <td class="text-right">${this.formatearMoneda(promedio)}</td>
            </tr>
        `;
        });

        html += `
                </tbody>
            </table>
        </div>
    `;

        return html;
    }

    mostrarResultadosInventario(data) {
        const container = document.getElementById('resultadosReporte');

        let html = `
            <div class="resultados-header">
                <h3 class="resultados-title">
                    <i class="fas fa-boxes"></i>
                    Reporte de Inventario
                </h3>
                <div class="acciones-reporte">
                    <button class="btn btn-primary" onclick="reportesManager.descargarPDF()">
                        <i class="fas fa-download"></i> Descargar PDF
                    </button>
                </div>
            </div>

            <div class="resumen-totales">
                <div class="total-row">
                    <span>Total Productos:</span>
                    <span><strong>${data.totalProductos || 0}</strong></span>
                </div>
                <div class="total-row">
                    <span>Valor Total Inventario:</span>
                    <span><strong>${this.formatearMoneda(data.valorTotalInventario || 0)}</strong></span>
                </div>
                <div class="total-row">
                    <span>Productos con Stock Bajo:</span>
                    <span><strong class="text-warning">${data.productosStockBajo || 0}</strong></span>
                </div>
                <div class="total-row">
                    <span>Productos sin Stock:</span>
                    <span><strong class="text-danger">${data.productosStockCritico || 0}</strong></span>
                </div>
            </div>
        `;

        // Tabla de inventario detallado
        if (Array.isArray(data.productos)) {
            html += `<h4>Inventario Detallado</h4>`;
            html += this.generarTablaInventario(data.productos);
        }
        container.innerHTML = html;
        this.ocultarLoading();
    }

    mostrarResultadosCompras(data) {
        const container = document.getElementById('resultadosReporte');

        let html = `
            <div class="resultados-header">
                <h3 class="resultados-title">
                    <i class="fas fa-shopping-cart"></i>
                    Reporte de Compras
                </h3>
                <div class="acciones-reporte">
                    <button class="btn btn-primary" onclick="reportesManager.descargarPDF()">
                        <i class="fas fa-download"></i> Descargar PDF
                    </button>
                </div>
            </div>

            <div class="resumen-totales">
                <div class="total-row">
                    <span>Total Compras:</span>
                    <span><strong>${data.totalCompras || 0}</strong></span>
                </div>
                <div class="total-row">
                    <span>Total Invertido:</span>
                    <span><strong>${this.formatearMoneda(data.totalInvertido || 0)}</strong></span>
                </div>
            </div>
        `;

        // Compras por proveedor
        if (data.comprasPorProveedor) {
            html += `<h4>Compras por Proveedor</h4>`;
            html += this.generarTablaComprasPorProveedor(data.comprasPorProveedor);
        }

        container.innerHTML = html;
        this.ocultarLoading();
    }

    generarTablaComprasPorProveedor(comprasPorProveedor) {
        if (!Array.isArray(comprasPorProveedor) || comprasPorProveedor.length === 0) {
            return `<div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-truck"></i></div>
                    <h4>No hay compras registradas por proveedor</h4>
                </div>`;
        }

        let html = `
        <div class="table-responsive">
            <table class="tabla-reporte">
                <thead>
                    <tr>
                        <th>Proveedor</th>
                        <th>Cantidad de Compras</th>
                        <th>Total Invertido</th>
                        <th>Promedio por Compra</th>
                    </tr>
                </thead>
                <tbody>
    `;

        comprasPorProveedor.forEach(item => {
            const promedio = item.totalInvertido && item.cantidad
                ? item.totalInvertido / item.cantidad
                : 0;

            html += `
            <tr>
                <td>${item.proveedor || 'Sin nombre'}</td>
                <td class="text-right">${item.cantidad || 0}</td>
                <td class="text-right">${this.formatearMoneda(item.totalInvertido || 0)}</td>
                <td class="text-right">${this.formatearMoneda(promedio)}</td>
            </tr>
        `;
        });

        html += `
                </tbody>
            </table>
        </div>
    `;

        return html;
    }

    mostrarProductosMasVendidos(data) {
        const container = document.getElementById('resultadosReporte');

        let html = `
            <div class="resultados-header">
                <h3 class="resultados-title">
                    <i class="fas fa-star"></i>
                    Productos Más Vendidos
                </h3>
                <div class="acciones-reporte">
                    <button class="btn btn-primary" onclick="reportesManager.descargarPDF()">
                        <i class="fas fa-download"></i> Descargar PDF
                    </button>
                </div>
            </div>
        `;

        if (Array.isArray(data) && data.length > 0) {
            html += this.generarTablaProductosMasVendidos(data);
        } else {
            html += `<div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-chart-pie"></i>
                </div>
                <h4>No hay datos de productos vendidos</h4>
                <p>No se encontraron ventas en el período seleccionado.</p>
            </div>`;
        }

        container.innerHTML = html;
        this.ocultarLoading();
    }

    mostrarMovimientosInventario(data) {
        const container = document.getElementById('resultadosReporte');
        if (!container) return;

        // Si no hay datos
        if (!data) {
            container.innerHTML = `
            <div class="alert alert-warning">
                ⚠️ No se encontraron movimientos de inventario en el rango seleccionado.
            </div>
        `;
            return;
        }

        let html = `
        <div class="resultados-header">
            <h3 class="resultados-title">
                <i class="fas fa-exchange-alt"></i>
                Movimientos de Inventario
            </h3>
            <div class="acciones-reporte">
                <button class="btn btn-primary" onclick="reportesManager.descargarPDF()">
                    <i class="fas fa-download"></i> Descargar PDF
                </button>
            </div>
        </div>

        <div class="descripcion-reporte">
            <p>Resumen de todas las entradas, salidas y ajustes registrados en el inventario.</p>
        </div>

        <div class="resumen-totales">
            <div class="total-row">
                <span>Total de Movimientos:</span>
                <span><strong>${data.totalMovimientos || 0}</strong></span>
            </div>
        </div>
    `;

        // 🟦 Movimientos por tipo
        if (data.movimientosPorTipo && data.movimientosPorTipo.length > 0) {
            html += `
            <h4> Movimientos por Tipo</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Tipo de Movimiento</th>
                        <th>Cantidad Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
            data.movimientosPorTipo.forEach(item => {
                html += `
                <tr>
                    <td>${item.tipo || item.Tipo || 'N/A'}</td>
                    <td>${item.cantidad || item.Cantidad || 0}</td>
                </tr>
            `;
            });
            html += `
                </tbody>
            </table>
        `;
        }

        // 🟨 Movimientos por producto
        if (data.movimientosPorProducto && data.movimientosPorProducto.length > 0) {
            html += `
            <h4>Movimientos por Producto</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad Total Movida</th>
                    </tr>
                </thead>
                <tbody>
        `;
            data.movimientosPorProducto.forEach(item => {
                html += `
                <tr>
                    <td>${item.producto || item.Producto || 'N/A'}</td>
                    <td>${item.cantidad || item.Cantidad || 0}</td>
                </tr>
            `;
            });
            html += `
                </tbody>
            </table>
        `;
        }

        // 💰 Resumen valorado (si tu backend lo envía)
        if (data.resumenValorado) {
            html += `
            <h4>Resumen Valorado</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Valor Total (Q)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Entradas</td><td>Q${(data.resumenValorado.entradas || 0).toFixed(2)}</td></tr>
                    <tr><td>Salidas</td><td>Q${(data.resumenValorado.salidas || 0).toFixed(2)}</td></tr>
                    <tr><td><strong>Total Movido</strong></td><td><strong>Q${(data.resumenValorado.total || 0).toFixed(2)}</strong></td></tr>
                </tbody>
            </table>
        `;
        }

        container.innerHTML = html;
        this.ocultarLoading?.();
    }

    generarTablaMovimientosPorTipo(data) {
        if (!Array.isArray(data) || data.length === 0)
            return `<p class="no-data">No hay movimientos registrados.</p>`;

        let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Tipo de Movimiento</th>
                    <th>Cantidad</th>
                </tr>
            </thead>
            <tbody>
    `;

        data.forEach(item => {
            html += `
            <tr>
                <td>${item.tipo || item.Tipo || "N/A"}</td>
                <td>${item.cantidad || item.Cantidad || 0}</td>
            </tr>
        `;
        });

        html += `
            </tbody>
        </table>
    `;

        return html;
    }

    // Métodos para generar tablas específicas
    generarTablaInventario(productos) {
        let html = `
            <div class="table-responsive">
                <table class="tabla-reporte">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Stock Actual</th>
                            <th>Stock Mínimo</th>
                            <th>Precio Costo</th>
                            <th>Precio Venta</th>
                            <th>Valor Stock</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        productos.forEach(producto => {
            const valorStock = (producto.stockActual || 0) * (producto.precioCostoPromedio || 0);
            const estadoStock = this.getEstadoStock(producto.stockActual, producto.stockMinimo);

            html += `
                <tr>
                    <td>${producto.codigo || 'N/A'}</td>
                    <td>${producto.nombre || 'N/A'}</td>
                    <td>${producto.categoriaNombre || 'Sin categoría'}</td>
                    <td class="text-right">${this.formatearNumero(producto.stockActual)}</td>
                    <td class="text-right">${this.formatearNumero(producto.stockMinimo)}</td>
                    <td class="text-right">${this.formatearMoneda(producto.precioCostoPromedio)}</td>
                    <td class="text-right">${this.formatearMoneda(producto.precioVenta)}</td>
                    <td class="text-right"><strong>${this.formatearMoneda(valorStock)}</strong></td>
                    <td><span class="stock-badge ${estadoStock.clase}">${estadoStock.texto}</span></td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        return html;
    }

    generarTablaProductosMasVendidos(productos) {
        let html = `
            <div class="table-responsive">
                <table class="tabla-reporte">
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

        productos.forEach((producto, index) => {
            const promedio = producto.totalVendido / producto.cantidadVendida;

            html += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${producto.productoNombre}</td>
                    <td class="text-right">${this.formatearNumero(producto.cantidadVendida)}</td>
                    <td class="text-right"><strong>${this.formatearMoneda(producto.totalVendido)}</strong></td>
                    <td class="text-right">${this.formatearMoneda(promedio)}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        return html;
    }

    generarTablaVentasPorEstado(ventasPorEstado) {
        let html = `
            <div class="table-responsive">
                <table class="tabla-reporte">
                    <thead>
                        <tr>
                            <th>Estado</th>
                            <th>Cantidad</th>
                            <th>Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        ventasPorEstado.forEach(item => {
            html += `
                <tr>
                    <td><span class="badge badge-success">${item.estado}</span></td>
                    <td class="text-right">${item.cantidad}</td>
                    <td class="text-right">${this.calcularPorcentaje(item.cantidad, ventasPorEstado)}%</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        return html;
    }

    // Métodos utilitarios
    getEstadoStock(stockActual, stockMinimo) {
        if (stockActual === 0) {
            return { clase: 'stock-critico', texto: 'SIN STOCK' };
        } else if (stockActual <= stockMinimo) {
            return { clase: 'stock-bajo', texto: 'BAJO' };
        } else {
            return { clase: 'stock-normal', texto: 'NORMAL' };
        }
    }

    formatearMoneda(valor) {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(valor);
    }

    formatearNumero(valor) {
        return new Intl.NumberFormat('es-GT').format(valor);
    }

    calcularPorcentaje(valor, array) {
        const total = array.reduce((sum, item) => sum + item.cantidad, 0);
        return ((valor / total) * 100).toFixed(1);
    }

    mostrarLoading() {
        const container = document.getElementById('resultadosReporte');
        container.innerHTML = `
            <div class="loading-reporte">
                <div class="spinner-reporte"></div>
                <p>Cargando reporte...</p>
            </div>
        `;
    }

    ocultarLoading() {
        // El loading se oculta automáticamente cuando se carga el contenido
    }

    mostrarError(mensaje) {
        const container = document.getElementById('resultadosReporte');
        container.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle"></i>
                ${mensaje}
            </div>
        `;
    }

    async descargarPDF() {
        try {
            let url = '';

            switch (this.currentReportType) {
                case 'ventas':
                    url = `/api/reportes/pdf/ventas?fechaInicio=${this.currentFilters.fechaInicio}&fechaFin=${this.currentFilters.fechaFin}`;
                    break;

                case 'compras':
                    url = `/api/reportes/pdf/compras?fechaInicio=${this.currentFilters.fechaInicio}&fechaFin=${this.currentFilters.fechaFin}`;
                    break;

                case 'inventario':
                    url = `/api/reportes/pdf/inventario`;
                    break;

                case 'movimientos':
                    url = `/api/reportes/pdf/movimientos?fechaInicio=${this.currentFilters.fechaInicio}&fechaFin=${this.currentFilters.fechaFin}`;
                    break;

                default:
                    this.mostrarError('Descarga PDF no disponible para este tipo de reporte');
                    return;
            }

            // Crear enlace temporal para descarga
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_${this.currentReportType}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            this.mostrarError('Error al descargar PDF: ' + error.message);
        }
    }


    exportarExcel() {
        // Implementación básica de exportación a Excel
        this.mostrarError('La exportación a Excel estará disponible próximamente');
    }
}

window.inicializarSeccionReportes = function () {
    try {
        const required = [
            "fechaInicio", "fechaFin", "tipoReporte",
            "topProductos", "tipoMovimiento", "btnAplicarFiltros"
        ];

        const check = () => {
            const ok = required.every(id => document.getElementById(id));
            if (!ok) return setTimeout(check, 100);

            if (!window.reportesManager) {
                window.reportesManager = new ReportesManager();
                console.log("✅ ReportesManager inicializado");
            } else {
                window.reportesManager.actualizarReporte();
            }
        };

        check();
    } catch (e) {
        console.error("Error al inicializar reportes:", e);
    }
};
