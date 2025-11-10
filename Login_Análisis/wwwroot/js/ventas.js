window.productos = window.productos || [];
window.detallesVenta = window.detallesVenta || [];

async function loadProductos() {
    try {
        const authToken = localStorage.getItem("authToken");
        const response = await fetch("https://localhost:7000/api/productos", {
            headers: { "Authorization": `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error("No se pudieron cargar los productos");

        productos = await response.json();
        console.log("✅ Productos cargados:", productos);

    } catch (err) {
        console.error("❌ Error al cargar productos:", err);
        showMessage("Error al cargar productos", "error");
    }
}

// Funciones para Ventas
async function showVentaForm() {
    console.log('Mostrando formulario de venta');
    openManagementTab('ventas');

    // Cargar ventas y productos antes de mostrar el formulario
    await Promise.all([
        loadProductos(),
        cargarVentasRealizadas()
    ]);

    const form = document.getElementById('ventaForm');
    if (form) {
        form.style.display = 'block';

        // Reiniciar formulario
        document.getElementById('ventaFormElement').reset();
        document.getElementById('ventaAplicarIVA').checked = true;
        document.getElementById('ventaDescuentoGlobal').value = '0';

        // Reiniciar detalles
        detallesVenta = [];
        renderDetallesVentaTable();
        calcularTotalesVenta();

        // Llenar el select con los productos disponibles
        updateProductosSelectVenta();
    }
}

function hideVentaForm() {
    const form = document.getElementById('ventaForm');
    if (form) form.style.display = 'none';
    detallesVenta = [];
}

function updateProductosSelectVenta() {
    const select = document.getElementById('ventaProducto');
    if (!select) return;

    if (!productos || productos.length === 0) {
        select.innerHTML = '<option value="">No hay productos disponibles</option>';
        return;
    }

    select.innerHTML = '<option value="">Seleccionar producto...</option>' +
        productos.filter(p => p.estado !== false).map(p => {
            const precio = p.precioVenta || 0;
            const stock = p.stockActual || 0;
            return `
                <option value="${p.id}" data-precio="${precio}" data-stock="${stock}">
                    ${p.nombre} - Q${precio.toFixed(2)} (Stock: ${stock.toFixed(2)})
                </option>
            `;
        }).join('');
}


// Busqueda de Cliente por NIT

document.addEventListener("DOMContentLoaded", () => {
    const nitInput = document.getElementById("ventaClienteNIT");
    const nombreInput = document.getElementById("ventaClienteNombre");
    const clienteIdInput = document.getElementById("ventaClienteId");
    const loader = document.getElementById("clienteLoader");
    const nitMsg = document.getElementById("nitMensaje");

    if (!nitInput) {
        console.warn("⚠️ Campo NIT no encontrado en el DOM. Verifica el ID ventaClienteNIT.");
        return;
    }

    let nitDelay;

    nitInput.addEventListener("input", () => {
        clearTimeout(nitDelay);
        const nit = nitInput.value.trim();

        if (!nit) {
            loader.style.display = "none";
            nitMsg.textContent = "";
            nombreInput.value = "";
            clienteIdInput.value = "";
            nombreInput.removeAttribute("readonly");
            return;
        }

        // Mostrar spinner mientras se espera
        loader.style.display = "block";
        nitMsg.textContent = "Buscando cliente...";
        nitMsg.className = "text-muted";

        nitDelay = setTimeout(async () => {
            try {
                // Caso especial: CF = Consumidor Final
                if (nit.toUpperCase() === "CF") {
                    loader.style.display = "none";
                    nombreInput.value = "Consumidor Final";
                    nombreInput.removeAttribute("readonly");
                    clienteIdInput.value = "";
                    nitMsg.textContent = " ";
                    nitMsg.className = "text-info";
                    return;
                }

                // Petición a tu API
                const authToken = localStorage.getItem("authToken");
                const url = `https://localhost:7000/api/clientes/buscar-por-nit/${encodeURIComponent(nit)}`;
                console.log("🔍 Buscando cliente en:", url);

                const response = await fetch(url, {
                    headers: {
                        "Authorization": `Bearer ${authToken || ""}`,
                        "Content-Type": "application/json"
                    }
                });

                loader.style.display = "none";

                if (response.ok) {
                    const cliente = await response.json();
                    console.log("✅ Cliente encontrado:", cliente);

                    if (cliente && cliente.nombre) {
                        clienteIdInput.value = cliente.id || "";
                        nombreInput.value = cliente.nombre;
                        nombreInput.setAttribute("readonly", true);
                        nitMsg.textContent = ` `;
                        nitMsg.className = "text-success";
                    } else {
                        nombreInput.value = "";
                        clienteIdInput.value = "";
                        nitMsg.textContent = "Cliente encontrado pero sin nombre registrado.";
                        nitMsg.className = "text-warning";
                    }
                } else {
                    // Cliente no existe en BD
                    nombreInput.value = "";
                    clienteIdInput.value = "";
                    nombreInput.removeAttribute("readonly");
                    nitMsg.textContent = "Cliente no registrado. Puede ingresarlo manualmente.";
                    nitMsg.className = "text-warning";
                    console.warn("⚠️ Respuesta no OK:", response.status);
                }
            } catch (err) {
                loader.style.display = "none";
                nombreInput.value = "";
                clienteIdInput.value = "";
                nitMsg.textContent = "Error al buscar cliente.";
                nitMsg.className = "text-danger";
                console.error("❌ Error en búsqueda de cliente:", err);
            }
        }, 600); // espera 600 ms después de dejar de escribir
    });
});

function obtenerDescuentoPorCantidad(cantidad) {
    if (cantidad >= 100) return 15; // Fardo
    if (cantidad >= 50) return 10;  // Caja
    if (cantidad >= 6) return 5;    // Por unidad (volumen)
    return 0;
}

// Cuando se selecciona un producto en ventas
function onProductoSelectChange() {
    const select = document.getElementById('ventaProducto');
    const selectedOption = select.options[select.selectedIndex];

    if (selectedOption.value) {
        const precio = parseFloat(selectedOption.getAttribute('data-precio')) || 0;
        const stock = parseFloat(selectedOption.getAttribute('data-stock')) || 0;

        document.getElementById('ventaPrecioUnitario').value = precio.toFixed(2);

        // Mostrar información de stock
        if (stock <= 0) {
            showMessage('Producto sin stock disponible', 'warning');
        }
    }
}

function agregarDetalleVenta() {
    const productoSelect = document.getElementById('ventaProducto');
    const productoId = parseInt(productoSelect.value);
    const cantidad = parseFloat(document.getElementById('ventaCantidad').value) || 0;

    if (!productoId || isNaN(productoId)) {
        showMessage('Seleccione un producto válido', 'error');
        return;
    }

    if (cantidad <= 0) {
        showMessage('La cantidad debe ser mayor a 0', 'error');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        showMessage('Producto no encontrado', 'error');
        return;
    }

    // Validar stock
    if (producto.stockActual < cantidad) {
        showMessage(`Stock insuficiente. Stock disponible: ${producto.stockActual}`, 'error');
        return;
    }

    // Calcular descuento automático
    const descuento = obtenerDescuentoPorCantidad(cantidad);
    const precioUnitario = producto.precioVenta || 0;
    const precioConDescuento = precioUnitario * (1 - descuento / 100);
    const totalLinea = cantidad * precioConDescuento;

    // ⚙️ Asegurar unidad de medida válida (evita el 400 del backend)
    const unidadMedidaId = producto.unidadMedidaBaseId || 1;

    const detalle = {
        productoId,
        productoNombre: producto.nombre,
        unidadMedidaId,
        cantidad,
        precioUnitario,
        descuentoAplicado: descuento,
        totalLinea
    };

    // Si el producto ya está en la lista, sumar cantidades
    const existente = detallesVenta.find(d => d.productoId === productoId);
    if (existente) {
        existente.cantidad += cantidad;
        existente.totalLinea = existente.cantidad * existente.precioUnitario;
    } else {
        detallesVenta.push(detalle);
    }

    renderDetallesVentaTable();
    calcularTotalesVenta();
    actualizarStockEnTiempoReal(productoId, cantidad);

    // Reset campos
    productoSelect.selectedIndex = 0;
    document.getElementById('ventaCantidad').value = 1;
    document.getElementById('ventaPrecioUnitario').value = '';
}

function actualizarStockEnTiempoReal(productoId, cantidadVendida) {
    const producto = productos.find(p => p.id === productoId);
    if (producto) {
        producto.stockActual -= cantidadVendida;
        if (producto.stockActual < 0) producto.stockActual = 0;
    }

    updateProductosSelectVenta(); // refresca el dropdown
}

function renderDetallesVentaTable() {
    const tbody = document.getElementById('detallesVentaTableBody');
    if (!tbody) return;

    if (detallesVenta.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay productos agregados</td></tr>';
        return;
    }

    tbody.innerHTML = detallesVenta.map((d, i) => `
        <tr>
            <td>${d.productoNombre}</td>
            <td>${d.cantidad}</td>
            <td>Q ${d.precioUnitario.toFixed(2)}</td>
            <td>${d.descuentoAplicado}%</td>
            <td>Q ${d.totalLinea.toFixed(2)}</td>
            <td>
                <button class="action-btn delete-btn" onclick="eliminarDetalleVenta(${i})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function eliminarDetalleVenta(index) {
    detallesVenta.splice(index, 1);
    renderDetallesVentaTable();
    calcularTotalesVenta();
}

function formatearQ(monto) {
    return `Q ${monto.toFixed(2)}`;
}

function calcularTotalesVenta() {
    const subtotal = detallesVenta.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const descuentoGlobal = parseFloat(document.getElementById('ventaDescuentoGlobal').value) || 0;
    const aplicarIVA = document.getElementById('ventaAplicarIVA').checked;

    const subtotalConDescuento = Math.max(0, subtotal - descuentoGlobal);
    const impuestos = aplicarIVA ? subtotalConDescuento * 0.12 : 0; 
    const total = subtotalConDescuento + impuestos;

    document.getElementById('ventaSubtotal').textContent = formatearQ(subtotal);
    document.getElementById('ventaDescuentoGlobalTotal').textContent = formatearQ(descuentoGlobal);
    document.getElementById('ventaImpuestos').textContent = formatearQ(impuestos);
    document.getElementById('ventaTotal').textContent = formatearQ(total);
}

function simularPagoTarjeta() {
    return new Promise(resolve => {
        Swal.fire({
            title: 'Procesando Pago...',
            html: `
                <div style="font-size:18px; margin-top:10px;">Insertando o leyendo tarjeta...</div>
                <div class="loader-tarjeta" style="
                    margin:20px auto; 
                    width:50px; 
                    height:50px; 
                    border:5px solid #ccc; 
                    border-top:5px solid #4CAF50;
                    border-radius:50%;
                    animation: spin 1s linear infinite;
                "></div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            backdrop: true
        });

        setTimeout(() => {
            Swal.close();
            Swal.fire({
                icon: 'success',
                title: 'Pago aprobado',
                text: 'La transacción fue procesada correctamente.',
                timer: 1500,
                showConfirmButton: false
            });

            setTimeout(() => resolve(), 1600);
        }, 2500);
    });
}

async function handleVentaSubmit(e) {
    e.preventDefault();

    if (detallesVenta.length === 0) {
        showMessage('Debe agregar al menos un producto a la venta', 'error');
        return;
    }

    const metodoPagoSeleccionado = document.getElementById('ventaMetodoPago')?.value || "Efectivo";
    if (metodoPagoSeleccionado === "Tarjeta") {
        await simularPagoTarjeta();
    }

    const clienteId = document.getElementById('ventaClienteId')?.value || null;
    const clienteNombre = document.getElementById('ventaClienteNombre')?.value?.trim();
    const clienteNIT = document.getElementById('ventaClienteNIT')?.value?.trim() || 'CF';

    if (!clienteNombre) {
        showMessage('Debe ingresar el nombre del cliente', 'error');
        return;
    }

    const ventaData = {
        FechaVenta: new Date().toISOString(),
        ClienteId: clienteId ? parseInt(clienteId) : null,
        NombreCliente: clienteNombre,
        NITCliente: clienteNIT,
        DescuentoGlobal: parseFloat(document.getElementById('ventaDescuentoGlobal').value) || 0,
        AplicarIVA: document.getElementById('ventaAplicarIVA').checked,
        Observaciones: document.getElementById('ventaObservaciones')?.value || '',
        UsuarioCreacion: JSON.parse(localStorage.getItem('user')).id || 1,
        MetodoPago: metodoPagoSeleccionado,
        Detalles: detallesVenta.map(d => ({
            ProductoId: d.productoId,
            UnidadMedidaId: d.unidadMedidaId || 1,
            Cantidad: d.cantidad,
            PrecioUnitario: d.precioUnitario,
            DescuentoAplicado: d.descuentoAplicado
        }))
    };

    console.log('📦 Datos de venta a enviar:', ventaData);

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(ventaData)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Error al registrar venta:', result);
            showMessage(result.Message || 'Error al registrar la venta', 'error');
            return;
        }

        showMessage('✅ Venta registrada exitosamente', 'success');
        mostrarResumenVenta(result.Venta);

        // Reiniciar formulario
        document.getElementById('ventaFormElement').reset();
        detallesVenta = [];
        renderDetallesVentaTable();
        calcularTotalesVenta();

        // Recargar productos y ventas
        await loadProductos();
        await cargarVentasRealizadas();

    } catch (error) {
        console.error('💥 Error de conexión:', error);
        showMessage('Error de conexión con el servidor', 'error');
    }
}

async function descargarFacturaPdf(ventaId) {
    try {
        const response = await fetch(`/api/ventas/${ventaId}/pdf`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `factura_${ventaId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showMessage('Factura descargada exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error al descargar la factura', 'error');
    }
}

async function cargarEstadisticasVentas() {
    try {
        const response = await fetch('/api/ventas/estadisticas');
        if (response.ok) {
            const estadisticas = await response.json();
            document.getElementById('ventasHoy').textContent = estadisticas.ventasHoy || 0;
            document.getElementById('ingresosHoy').textContent = `Q${(estadisticas.ingresosHoy || 0).toFixed(2)}`;
            document.getElementById('ventasMes').textContent = estadisticas.ventasMes || 0;
            document.getElementById('ingresosMes').textContent = `Q${(estadisticas.ingresosMes || 0).toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Configuración de descuentos
function configurarDescuentos() {
    openManagementTab('descuentos');
}

function cargarUnidadesParaVenta() {
    // Implementar si es necesario para ventas
}

async function cargarVentas() {
    // Implementar carga de ventas si es necesario
    console.log('Cargando ventas...');
}

function mostrarResumenVenta(venta) {
    const contenedor = document.getElementById('ventaResumen');
    const contenido = document.getElementById('ventaResumenContent');
    const btnFactura = document.getElementById('btnDescargarFactura');

    if (!venta) return;

    const fecha = new Date(venta.fechaVenta).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });

    contenido.innerHTML = `
        <div class="resumen-box">
            <p><strong>Factura N°:</strong> ${venta.numeroFactura || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Cliente:</strong> ${venta.nombreCliente}</p>
            <p><strong>NIT:</strong> ${venta.nitCliente}</p>
             <p><strong>Método de Pago:</strong> ${venta.metodoPago || 'Efectivo'}</p>
            <p><strong>Total Venta:</strong> Q ${venta.total.toFixed(2)}</p>
        </div>

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Desc.</th>
                        <th>Total Línea</th>
                    </tr>
                </thead>
                <tbody>
                    ${venta.detalles.map(d => `
                        <tr>
                            <td>${d.productoNombre}</td>
                            <td>${d.cantidad}</td>
                            <td>Q ${d.precioUnitario.toFixed(2)}</td>
                            <td>${d.descuentoAplicado}%</td>
                            <td>Q ${(d.cantidad * d.precioUnitario).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('resMetodoPago').textContent = venta.metodoPago;

    // Mostrar el bloque de resumen
    contenedor.style.display = 'block';

    // Asignar evento de descarga
    btnFactura.onclick = () => descargarFacturaPdf(venta.id);
}

function cargarVentas() {
    // Evita el error al cambiar el nombre de la función
    if (typeof cargarVentasRealizadas === 'function') {
        cargarVentasRealizadas();
    } else {
        console.warn('⚠️ cargarVentasRealizadas no está definida');
    }
}


async function cargarVentasRealizadas() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('https://localhost:7000/api/ventas', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            console.warn(`⚠️ API devolvió ${response.status}`);
            document.querySelector('#tablaVentasRealizadas tbody').innerHTML =
                '<tr><td colspan="7" class="no-data">Error al cargar ventas</td></tr>';
            return;
        }

        const ventas = await response.json();
        const tbody = document.querySelector('#tablaVentasRealizadas tbody');

        if (!ventas || ventas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No hay ventas registradas</td></tr>';
            return;
        }

        tbody.innerHTML = ventas.map(v => `
            <tr>
                <td>${v.numeroFactura || '-'}</td>
                <td>${v.nombreCliente}</td>
                <td>${v.nitCliente}</td>
                <td>${new Date(v.fechaVenta).toLocaleString()}</td>
                <td>Q ${parseFloat(v.total).toFixed(2)}</td>
                <td>${v.usuarioCreacionNombre ?? v.usuario?.nombre ?? v.usuario?.Usuario ?? 'Desconocido'}</td>
                <td>${v.metodoPago || 'Efectivo'}</td>
                <td style="text-align:center;">
                    <button class="btn btn-sm btn-info" onclick="verDetallesVenta(${v.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="descargarFacturaPdf(${v.id})">
                        <i class="fas fa-file-download"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar ventas:', error);
        showMessage('Error al cargar ventas', 'error');
    }
}

async function verDetallesVenta(ventaId) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`https://localhost:7000/api/ventas/${ventaId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('No se pudo obtener el detalle de la venta');

        const venta = await response.json();

        const detallesHtml = venta.detalles.map(d => `
            <tr>
                <td>${d.productoNombre}</td>
                <td>${d.cantidad}</td>
                <td>Q ${d.precioUnitario.toFixed(2)}</td>
                <td>${d.descuentoAplicado || 0}%</td>
                <td>Q ${(d.cantidad * d.precioUnitario).toFixed(2)}</td>
            </tr>
        `).join('');

        Swal.fire({
            title: `Factura N° ${venta.numeroFactura}`,
            html: `
                <p><strong>Cliente:</strong> ${venta.nombreCliente}</p>
                <p><strong>Fecha:</strong> ${new Date(venta.fechaVenta).toLocaleString()}</p>
                <table class="data-table" style="margin-top:10px;">
                    <thead>
                        <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Desc.</th><th>Total</th></tr>
                    </thead>
                    <tbody>${detallesHtml}</tbody>
                </table>
                <p style="margin-top:10px;"><strong>Total:</strong> Q ${venta.total.toFixed(2)}</p>
            `,
            confirmButtonText: 'Cerrar',
            width: 800
        });

    } catch (error) {
        console.error('Error al ver detalles:', error);
        showMessage('Error al obtener detalles', 'error');
    }
}