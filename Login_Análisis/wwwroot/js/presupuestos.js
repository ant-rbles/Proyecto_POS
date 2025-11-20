// ======================================================================
//  presupuestos.js — versión mejorada (unidades de medida + mejor diseño)
// ======================================================================

// Estado local
let presupuestos = [];
let presupuestoEditando = null;
let productosPresupuesto = [];
let usuarioActual = JSON.parse(localStorage.getItem('user') || 'null') || {};

// Obtener token
function getAuthToken() {
    if (typeof obtenerToken === 'function') return obtenerToken();
    return localStorage.getItem('authToken');
}

// Manejo de 401
function handle401(resp) {
    if (!resp) return false;
    if (resp.status === 401) {
        console.warn("⚠ 401 recibido — Sesión expirada");
        if (typeof logout === 'function') logout();
        else {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            window.location.href = "index.html";
        }
        return true;
    }
    return false;
}

// Helper seguro
function safeCall(fn, ...args) {
    if (typeof window[fn] === 'function') return window[fn](...args);
}

// ======================================================================
//  CARGAR UNIDADES DE MEDIDA - VERSIÓN ROBUSTA
// ======================================================================
async function cargarUnidadesParaPresupuesto() {
    try {
        console.log("🔧 Cargando unidades de medida...");
        
        const resp = await fetch("https://localhost:7000/api/unidadesmedida", {
            headers: { "Authorization": `Bearer ${getAuthToken()}` }
        });

        if (handle401(resp)) {
            console.error("❌ Error 401 al cargar unidades");
            return [];
        }
        
        if (!resp.ok) {
            console.error(`❌ Error HTTP ${resp.status} al cargar unidades`);
            return [];
        }

        const unidades = await resp.json();
        console.log("✅ Unidades cargadas:", unidades);

        // Guardar globalmente para uso posterior
        window.unidadesMedida = unidades;

        // Llenar el select
        const select = document.getElementById("productoUnidadBase");
        if (select) {
            select.innerHTML = 
                `<option value="">Seleccionar unidad...</option>` +
                unidades.map(u => 
                    `<option value="${u.id}">${u.nombre} (${u.abreviatura})</option>`
                ).join('');
            console.log("✅ Select de unidades llenado correctamente");
        } else {
            console.error("❌ No se encontró el select productoUnidadBase");
        }

        return unidades;
    } catch (e) {
        console.error("❌ Error al cargar unidades de medida:", e);
        return [];
    }
}

// ======================================================================
//  CARGAR LISTA DE PRESUPUESTOS
// ======================================================================
async function cargarListaPresupuestos() {
    try {
        safeCall("mostrarLoading");

        const resp = await fetch("https://localhost:7000/api/presupuestos", {
            headers: {
                "Authorization": `Bearer ${getAuthToken()}`
            }
        });

        if (handle401(resp)) return;

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ message: "Error" }));
            return safeCall("mostrarError", "Error al cargar presupuestos: " + err.message);
        }

        presupuestos = await resp.json();
        renderizarTablaPresupuestos();

    } catch (e) {
        console.error(e);
        safeCall("mostrarError", "Error de conexión");
    } finally {
        safeCall("ocultarLoading");
    }
}

// Alias para dashboard.js
async function cargarPresupuestos() {
    await Promise.all([
        cargarClientesParaPresupuesto(),
        cargarProductosParaPresupuesto(),
        cargarUnidadesParaPresupuesto(), // Cargar unidades también
        cargarListaPresupuestos()
    ]);
}

// ======================================================================
//  RENDER TABLA
// ======================================================================
function renderizarTablaPresupuestos() {
    const tbody = document.getElementById("tabla-presupuestos");
    if (!tbody) return;

    tbody.innerHTML = "";

    const filtroEstado = document.getElementById("filtro-estado")?.value || "TODOS";
    const filtroCliente = (document.getElementById("filtro-cliente")?.value || "").toLowerCase();
    const filtroDesde = document.getElementById("filtro-fecha-desde")?.value || "";
    const filtroHasta = document.getElementById("filtro-fecha-hasta")?.value || "";

    const filtrados = presupuestos.filter(p => {
        const c1 = filtroEstado === "TODOS" || p.estado === filtroEstado;
        const c2 = !filtroCliente || (p.nombreCliente || "").toLowerCase().includes(filtroCliente);
        const c3 = !filtroDesde || new Date(p.fechaPresupuesto) >= new Date(filtroDesde);
        const c4 = !filtroHasta || new Date(p.fechaPresupuesto) <= new Date(filtroHasta);
        return c1 && c2 && c3 && c4;
    });

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No hay presupuestos</td></tr>`;
        return;
    }

    filtrados.forEach(p => {
        let badge = "badge-secondary";
        switch ((p.estado || "").toUpperCase()) {
            case "PENDIENTE": badge = "badge-warning"; break;
            case "APROBADO": badge = "badge-success"; break;
            case "RECHAZADO": badge = "badge-danger"; break;
            case "CONVERTIDO": badge = "badge-info"; break;
        }

        const dias = Math.ceil((new Date(p.fechaVencimiento) - new Date()) / 86400000);
        const colorDias = dias <= 0 ? "text-danger" : dias <= 3 ? "text-warning" : "text-success";

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><strong>${p.numeroPresupuesto || p.id}</strong></td>
            <td>${p.nombreCliente}</td>
            <td>${new Date(p.fechaPresupuesto).toLocaleDateString()}</td>
            <td>${new Date(p.fechaVencimiento).toLocaleDateString()}</td>
            <td><strong>Q ${p.total.toFixed(2)}</strong></td>
            <td><span class="badge ${badge}">${p.estado}</span></td>
            <td><span class="${colorDias}">${dias} días</span></td>
            <td>
                <button class="btn btn-info btn-sm" onclick="verPresupuesto(${p.id})"><i class="fas fa-eye"></i></button>
                <button class="btn btn-secondary btn-sm" onclick="descargarPDF(${p.id})"><i class="fas fa-download"></i></button>

                ${p.estado === "PENDIENTE" ? `
                    <button class="btn btn-warning btn-sm" onclick="editarPresupuesto(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-success btn-sm" onclick="cambiarEstadoPresupuesto(${p.id}, 'APROBADO')"><i class="fas fa-check"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="cambiarEstadoPresupuesto(${p.id}, 'RECHAZADO')"><i class="fas fa-times"></i></button>
                ` : ""}

                ${(p.estado === "APROBADO") &&
                (usuarioActual.rol === "Administrador" || usuarioActual.rol === "Cajero") ?
                `<button class="btn btn-primary btn-sm" onclick="convertirEnVenta(${p.id})"><i class="fas fa-cash-register"></i></button>` : ""}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ======================================================================
//  CLIENTES (solo activos)
// ======================================================================
async function cargarClientesParaPresupuesto() {
    try {
        const resp = await fetch("https://localhost:7000/api/clientes/todos", {
            headers: { "Authorization": `Bearer ${getAuthToken()}` }
        });

        if (handle401(resp)) return [];
        if (!resp.ok) return [];

        const data = await resp.json();

        window.clientes = data.filter(c => c.estado === true);

        const sel = document.getElementById("presupuesto-cliente");
        if (sel) {
            sel.innerHTML =
                `<option value="">Seleccionar cliente…</option>` +
                window.clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("");

            sel.onchange = () => {
                const c = window.clientes.find(x => x.id == sel.value);
                if (!c) return;
                document.getElementById("presupuesto-nombre-cliente").value = c.nombre;
                document.getElementById("presupuesto-nit").value = c.nit || "";
                document.getElementById("presupuesto-direccion").value = c.direccion || "";
            };
        }

        return window.clientes;

    } catch (e) {
        console.error(e);
        return [];
    }
}

// ======================================================================
//  PRODUCTOS + UM
// ======================================================================
async function cargarProductosParaPresupuesto() {
    try {
        const resp = await fetch('https://localhost:7000/api/productos/todos', {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (!resp.ok) return [];
        const data = await resp.json();

        window.productos = data;

        const sel = document.getElementById('presupuesto-producto');
        if (sel) {
            sel.innerHTML =
                `<option value="">Seleccionar producto...</option>` +
                data.map(p =>
                    `<option value="${p.id}"
                        data-precio="${p.precioVenta || p.precio || 0}"
                        data-um="${p.unidadMedidaId}">
                        ${p.nombre} - Q ${(p.precioVenta || p.precio || 0).toFixed(2)}
                    </option>`
                ).join('');
        }

        return data;
    } catch (e) {
        console.error(e);
        return [];
    }
}

// ======================================================================
//  MODAL NUEVO PRESUPUESTO - DISEÑO MEJORADO
// ======================================================================
function abrirModalNuevoPresupuesto() {
    productosPresupuesto = [];
    presupuestoEditando = null;

    const old = document.getElementById("modalPresupuesto");
    if (old) old.remove();

    document.body.insertAdjacentHTML("beforeend", `
    <div id="modalPresupuesto" class="modal-backdrop" style="
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,.5); display: flex; justify-content: center; 
        align-items: center; z-index: 99999;
    ">
        <div class="modal-content" style="
            background: white; width: 95%; max-width: 1200px; max-height: 95vh;
            overflow-y: auto; padding: 30px; border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,.3);
        ">

            <!-- ENCABEZADO -->
            <div class="modal-header" style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #e9ecef;">
                <h2 style="margin: 0; color: #2c3e50; font-weight: 600;">Nuevo Presupuesto</h2>
                <button onclick="cerrarModalPresupuesto()" 
                        style="font-size: 28px; background:none; border:none; cursor:pointer; color: #6c757d; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                    &times;
                </button>
            </div>

            <form id="form-presupuesto-modal" style="display:flex; flex-direction:column; gap:25px;">

                <!-- INFORMACIÓN DEL CLIENTE -->
                <div class="section-card" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
                    <h5 style="margin: 0 0 15px 0; color: #2c3e50;">Información del Cliente</h5>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Cliente *</label>
                            <select id="presupuesto-cliente" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;"></select>
                        </div>
                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Nombre *</label>
                            <input id="presupuesto-nombre-cliente" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;">
                        </div>
                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">NIT</label>
                            <input id="presupuesto-nit" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;">
                        </div>
                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Dirección</label>
                            <input id="presupuesto-direccion" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;">
                        </div>
                    </div>
                </div>

                <!-- FECHAS -->
                <div class="section-card" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h5 style="margin: 0 0 15px 0; color: #2c3e50;">Fechas del Presupuesto</h5>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Fecha *</label>
                            <input type="date" id="presupuesto-fecha" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;">
                        </div>
                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Fecha de Vencimiento *</label>
                            <input type="date" id="presupuesto-vencimiento" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;">
                        </div>
                    </div>
                </div>

                <!-- AGREGAR PRODUCTOS -->
                <div class="section-card" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <h5 style="margin: 0 0 20px 0; color: #2c3e50;">Agregar Productos</h5>

                    <div style="
                        display: grid;
                        grid-template-columns: 2fr 1.2fr 0.8fr 1fr 0.8fr auto;
                        gap: 12px;
                        align-items: end;
                    ">
                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Producto *</label>
                            <select id="presupuesto-producto" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;"></select>
                        </div>

                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Unidad *</label>
                            <select id="productoUnidadBase" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;"></select>
                        </div>

                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Cantidad *</label>
                            <input type="number" id="presupuesto-cantidad" min="1" value="1" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;">
                        </div>

                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Precio *</label>
                            <input type="number" id="presupuesto-precio" step="0.01" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;">
                        </div>

                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Desc %</label>
                            <input type="number" id="presupuesto-descuento" min="0" max="100" value="0" class="form-control" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da;">
                        </div>

                        <div>
                            <label style="margin-bottom: 8px; display: block; color: transparent;">Agregar</label>
                            <button type="button" onclick="agregarProductoPresupuesto()" 
                                    class="btn btn-primary" 
                                    style="padding: 10px 15px; border-radius: 6px; white-space: nowrap;">
                                <i class="fas fa-plus"></i> Agregar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- LISTA DE PRODUCTOS AGREGADOS -->
                <div class="section-card" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
                    <h5 style="margin: 0 0 15px 0; color: #2c3e50;">Productos Agregados</h5>
                    <div class="table-responsive" style="border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1);">
                        <table class="table table-hover align-middle" style="margin: 0; background: white;">
                            <thead style="background:#2c3e50; color: white; font-weight: 600;">
                                <tr>
                                    <th style="width:30%; padding: 12px;">Producto</th>
                                    <th style="width:12%; padding: 12px; text-align:center;">UM</th>
                                    <th style="width:10%; padding: 12px; text-align:center;">Cantidad</th>
                                    <th style="width:15%; padding: 12px; text-align:right;">Precio Unit.</th>
                                    <th style="width:10%; padding: 12px; text-align:center;">Desc. %</th>
                                    <th style="width:15%; padding: 12px; text-align:right;">Total</th>
                                    <th style="width:8%; padding: 12px; text-align:center;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="lista-productos-presupuesto" style="border-top: none;">
                                <tr>
                                    <td colspan="7" style="text-align:center; padding: 20px; color: #6c757d;">
                                        No hay productos agregados
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- TOTALES -->
                <div class="section-card" style="background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;">
                        <div>
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">Observaciones</label>
                            <textarea id="presupuesto-observaciones" class="form-control" rows="3" style="padding: 10px; border-radius: 6px; border: 1px solid #ced4da; resize: vertical;" 
                                      placeholder="Notas adicionales sobre el presupuesto..."></textarea>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size: 1.1rem; margin-bottom: 10px; display: flex; justify-content: space-between;">
                                <span>Subtotal:</span>
                                <strong id="presupuesto-subtotal" style="color: #2c3e50;">Q 0.00</strong>
                            </div>
                            <div style="font-size: 1.1rem; margin-bottom: 10px; display: flex; justify-content: space-between;">
                                <span>IVA (12%):</span>
                                <strong id="presupuesto-iva" style="color: #2c3e50;">Q 0.00</strong>
                            </div>
                            <div style="font-size: 1.3rem; margin-top: 10px; padding-top: 10px; border-top: 2px solid #dee2e6; display: flex; justify-content: space-between;">
                                <span style="font-weight: 700;">TOTAL:</span>
                                <strong id="presupuesto-total" style="color: #28a745;">Q 0.00</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- BOTONES -->
                <div style="display:flex; justify-content: flex-end; gap:15px; margin-top: 10px;">
                    <button type="button" onclick="cerrarModalPresupuesto()" 
                            class="btn btn-secondary" 
                            style="padding: 12px 25px; border-radius: 6px; font-weight: 600;">
                        Cancelar
                    </button>
                    <button type="submit" 
                            class="btn btn-primary" 
                            style="padding: 12px 25px; border-radius: 6px; font-weight: 600;">
                        <i class="fas fa-save"></i> Guardar Presupuesto
                    </button>
                </div>

            </form>

        </div>
    </div>
`);

    // Configurar fechas
    const hoy = new Date().toISOString().split("T")[0];
    const venc = new Date();
    venc.setDate(venc.getDate() + 15);

    document.getElementById("presupuesto-fecha").value = hoy;
    document.getElementById("presupuesto-vencimiento").value = venc.toISOString().split("T")[0];

    // Cargar datos
    cargarClientesParaPresupuesto();
    cargarProductosParaPresupuesto();
    
    // Cargar unidades con retardo para asegurar que el DOM esté listo
    setTimeout(() => {
        cargarUnidadesParaPresupuesto();
    }, 100);

    // Configurar evento de cambio en producto para auto-completar precio
    const productoSelect = document.getElementById("presupuesto-producto");
    if (productoSelect) {
        productoSelect.onchange = function() {
            if (this.value) {
                const precio = this.selectedOptions[0].dataset.precio;
                document.getElementById("presupuesto-precio").value = precio || "";
            }
        };
    }

    actualizarListaProductosPresupuesto();
    calcularTotalesPresupuesto();

    document.getElementById("form-presupuesto-modal").onsubmit = guardarPresupuesto;
}

function cerrarModalPresupuesto() {
    const m = document.getElementById("modalPresupuesto");
    if (m) m.remove();
}

// ======================================================================
//  AGREGAR PRODUCTO (con UM real tomado desde productoUnidadBase)
// ======================================================================
function agregarProductoPresupuesto() {
    const sel = document.getElementById('presupuesto-producto');
    if (!sel.value) return safeCall('mostrarError', "Seleccione un producto");

    const nombre = sel.options[sel.selectedIndex].text.split(" - ")[0];
    const cantidad = parseFloat(document.getElementById('presupuesto-cantidad').value);
    const precio = parseFloat(document.getElementById('presupuesto-precio').value || sel.selectedOptions[0].dataset.precio);
    const desc = parseFloat(document.getElementById('presupuesto-descuento').value || 0);

    // Validaciones
    if (cantidad <= 0) return safeCall('mostrarError', "La cantidad debe ser mayor a 0");
    if (precio <= 0) return safeCall('mostrarError', "El precio debe ser mayor a 0");

    // AHORA SE USA LA UM DEL SELECT GLOBAL productoUnidadBase
    const unidadSelect = document.getElementById("productoUnidadBase");
    const unidadMedidaId = unidadSelect ? parseInt(unidadSelect.value) : NaN;

    if (!unidadMedidaId || isNaN(unidadMedidaId)) {
        return safeCall('mostrarError', "Seleccione una unidad de medida");
    }

    const subtotal = cantidad * precio;
    const totalLinea = subtotal - (subtotal * (desc / 100));

    productosPresupuesto.push({
        productoId: parseInt(sel.value),
        unidadMedidaId,
        productoNombre: nombre,
        cantidad,
        precioUnitario: precio,
        descuentoAplicado: desc,
        totalLinea
    });

    // Limpiar campos después de agregar
    document.getElementById('presupuesto-cantidad').value = 1;
    document.getElementById('presupuesto-descuento').value = 0;

    actualizarListaProductosPresupuesto();
    calcularTotalesPresupuesto();
    
    safeCall('mostrarExito', "Producto agregado correctamente");
}

// ======================================================================
//  ACTUALIZAR LISTA EN LA TABLA DEL MODAL (MUESTRA UM NOMBRE/ABR)
// ======================================================================
function actualizarListaProductosPresupuesto() {
    const tbody = document.getElementById("lista-productos-presupuesto");
    if (!tbody) return;

    if (productosPresupuesto.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 20px; color: #6c757d;">
                    No hay productos agregados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = "";

    productosPresupuesto.forEach((p, i) => {
        // Obtener nombre de unidad si existe la lista global unidadesMedida
        let unidadTexto = `ID: ${p.unidadMedidaId}`;
        try {
            if (window.unidadesMedida && Array.isArray(window.unidadesMedida)) {
                const u = window.unidadesMedida.find(x => x.id == p.unidadMedidaId);
                if (u) unidadTexto = `${u.nombre} (${u.abreviatura})`;
            }
        } catch (e) {
            // ignore
        }

        tbody.innerHTML += `
            <tr>
                <td style="padding: 12px;">${p.productoNombre}</td>
                <td style="padding: 12px; text-align:center;">${unidadTexto}</td>
                <td style="padding: 12px; text-align:center;">${p.cantidad}</td>
                <td style="padding: 12px; text-align:right;">Q ${p.precioUnitario.toFixed(2)}</td>
                <td style="padding: 12px; text-align:center;">${p.descuentoAplicado}%</td>
                <td style="padding: 12px; text-align:right; font-weight: 600;">Q ${p.totalLinea.toFixed(2)}</td>
                <td style="padding: 12px; text-align:center;">
                    <button class="btn btn-danger btn-sm" onclick="eliminarProductoPresupuesto(${i})" 
                            style="padding: 5px 10px; border-radius: 4px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function eliminarProductoPresupuesto(i) {
    productosPresupuesto.splice(i, 1);
    actualizarListaProductosPresupuesto();
    calcularTotalesPresupuesto();
    safeCall('mostrarExito', "Producto eliminado");
}

// ----------------------------------------------------------------------
//  CÁLCULOS DE TOTALES
// ----------------------------------------------------------------------
function calcularTotalesPresupuesto() {
    const subtotal = productosPresupuesto.reduce((sum, p) => sum + (p.totalLinea || 0), 0);
    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    document.getElementById("presupuesto-subtotal").textContent = `Q ${subtotal.toFixed(2)}`;
    document.getElementById("presupuesto-iva").textContent = `Q ${iva.toFixed(2)}`;
    document.getElementById("presupuesto-total").textContent = `Q ${total.toFixed(2)}`;
}

// Mantener alias por compatibilidad (algunos módulos podrían llamar a esta función)
function calcularTotalGeneral() {
    calcularTotalesPresupuesto();
}

// ----------------------------------------------------------------------
//  GUARDAR PRESUPUESTO (CREAR o ACTUALIZAR)
// ----------------------------------------------------------------------
async function guardarPresupuesto(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();

    if (!productosPresupuesto.length) {
        return safeCall("mostrarError", "Debe agregar al menos un producto");
    }

    // Validar campos obligatorios
    const nombreCliente = document.getElementById("presupuesto-nombre-cliente").value;
    if (!nombreCliente.trim()) {
        return safeCall("mostrarError", "El nombre del cliente es obligatorio");
    }

    const payload = {
        fechaPresupuesto: document.getElementById("presupuesto-fecha").value,
        fechaVencimiento: document.getElementById("presupuesto-vencimiento").value,
        clienteId: document.getElementById("presupuesto-cliente").value || null,
        nombreCliente: nombreCliente,
        nitCliente: document.getElementById("presupuesto-nit").value || "",
        direccionCliente: document.getElementById("presupuesto-direccion").value || "",
        observaciones: document.getElementById("presupuesto-observaciones").value || "",
        aplicarIVA: true,
        detalles: productosPresupuesto.map(p => ({
            productoId: p.productoId,
            cantidad: p.cantidad,
            precioUnitario: p.precioUnitario,
            descuentoAplicado: p.descuento || p.descuentoAplicado || 0,
            unidadMedidaId: p.unidadMedidaId,
            totalLinea: p.totalLinea
        }))
    };

    try {
        const token = getAuthToken();
        let url = `${API_URL}/api/presupuestos`;
        let method = "POST";

        if (presupuestoEditando) {
            url = `${API_URL}/api/presupuestos/${presupuestoEditando}`;
            method = "PUT";
        }

        const resp = await fetch(url, {
            method,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (handle401(resp)) return;

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ message: "Error" }));
            return safeCall("mostrarError", err.message || "No se pudo guardar el presupuesto");
        }

        safeCall("mostrarExito", presupuestoEditando ? "Presupuesto actualizado" : "Presupuesto creado");
        // Cerrar modal
        const modalEl = document.getElementById("modalPresupuesto");
        if (modalEl) modalEl.remove();

        // Recargar lista
        if (typeof cargarPresupuestos === "function") cargarPresupuestos();
    } catch (e) {
        console.error("guardarPresupuesto:", e);
        safeCall("mostrarError", "Error de conexión");
    }
}

// ----------------------------------------------------------------------
//  VER PRESUPUESTO (ALERTA SIMPLE o modal extendido)
// ----------------------------------------------------------------------
async function verPresupuesto(id) {
    try {
        const token = getAuthToken();
        const resp = await fetch(`${API_URL}/api/presupuestos/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!resp.ok) return safeCall("mostrarError", "No se pudo obtener el presupuesto");

        const p = await resp.json();
        // Mostrar un resumen rápido
        const detallesText = (p.detalles || []).map(d => `${d.productoNombre || d.productoId} x${d.cantidad} = Q ${d.totalLinea}`).join("\n");
        alert(`Presupuesto #${p.id}\nCliente: ${p.nombreCliente}\nTotal: Q ${p.total}\n\nDetalles:\n${detallesText}`);
    } catch (e) {
        console.error("verPresupuesto:", e);
        safeCall("mostrarError", "Error al obtener el presupuesto");
    }
}

// ----------------------------------------------------------------------
//  DESCARGAR PDF
// ----------------------------------------------------------------------
async function descargarPDF(id) {
    try {
        const token = getAuthToken();
        const resp = await fetch(`${API_URL}/api/presupuestos/${id}/pdf`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!resp.ok) return safeCall("mostrarError", "No se pudo generar el PDF");

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Presupuesto_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("descargarPDF:", e);
        safeCall("mostrarError", "Error al descargar PDF");
    }
}

// ----------------------------------------------------------------------
//  EDITAR PRESUPUESTO — carga datos y abre modal rellenado
// ----------------------------------------------------------------------
async function editarPresupuesto(id) {
    try {
        const token = getAuthToken();
        const resp = await fetch(`${API_URL}/api/presupuestos/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!resp.ok) return safeCall("mostrarError", "No se pudo cargar el presupuesto");

        const p = await resp.json();

        // Abrir modal vacío
        abrirModalNuevoPresupuesto();
        presupuestoEditando = id;

        // Rellenar campos
        document.getElementById("presupuesto-cliente").value = p.clienteId || "";
        document.getElementById("presupuesto-nombre-cliente").value = p.nombreCliente || "";
        document.getElementById("presupuesto-nit").value = p.nitCliente || "";
        document.getElementById("presupuesto-direccion").value = p.direccionCliente || "";

        document.getElementById("presupuesto-fecha").value = (p.fechaPresupuesto || "").split("T")[0] || new Date().toISOString().slice(0, 10);
        document.getElementById("presupuesto-vencimiento").value = (p.fechaVencimiento || "").split("T")[0] || "";

        // Map detalles a productosPresupuesto
        productosPresupuesto = (p.detalles || []).map(d => ({
            productoId: d.productoId,
            productoNombre: d.productoNombre || d.productoNombre,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            descuento: d.descuentoAplicado || d.descuento || 0,
            unidadMedidaId: d.unidadMedidaId || 1,
            totalLinea: d.totalLinea || (d.cantidad * d.precioUnitario - (d.cantidad * d.precioUnitario * ((d.descuentoAplicado || d.descuento || 0) / 100)))
        }));

        renderProductosPresupuesto();
        calcularTotalGeneral();

    } catch (e) {
        console.error("editarPresupuesto:", e);
        safeCall("mostrarError", "Error al cargar presupuesto");
    }
}

// ----------------------------------------------------------------------
//  CAMBIAR ESTADO (PUT)
// ----------------------------------------------------------------------
async function cambiarEstadoPresupuesto(id, estado) {
    try {
        const token = getAuthToken();
        const resp = await fetch(`${API_URL}/api/presupuestos/${id}/estado`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ estado })
        });

        if (!resp.ok) return safeCall("mostrarError", "No se pudo actualizar el estado");

        safeCall("mostrarExito", "Estado actualizado");
        if (typeof cargarPresupuestos === "function") cargarPresupuestos();
    } catch (e) {
        console.error("cambiarEstadoPresupuesto:", e);
        safeCall("mostrarError", "Error al actualizar estado");
    }
}


// ----------------------------------------------------------------------
//  INIT / EXPORTS
// ----------------------------------------------------------------------
function initPresupuestosModule() {
    const btn = document.getElementById("btn-nuevo-presupuesto");
    if (btn) btn.onclick = abrirModalNuevoPresupuesto;

    // Si la app tiene control de roles: mostrar botón según rol
    if (usuarioActual && usuarioActual.rol) {
        const btnNuevo = document.getElementById("btn-nuevo-presupuesto");
        if (btnNuevo) {
            btnNuevo.style.display = (usuarioActual.rol === "Vendedor" || usuarioActual.rol === "Administrador") ? "inline-block" : "none";
        }
    }
}

document.addEventListener("DOMContentLoaded", initPresupuestosModule);

// Exponer funciones globalmente
window.cargarPresupuestos = cargarPresupuestos;
window.cargarClientesParaPresupuesto = cargarClientesParaPresupuesto;
window.cargarProductosParaPresupuesto = cargarProductosParaPresupuesto;
window.cargarUnidadesParaPresupuesto = cargarUnidadesParaPresupuesto;
window.abrirModalNuevoPresupuesto = abrirModalNuevoPresupuesto;
window.cerrarModalPresupuesto = cerrarModalPresupuesto;
window.agregarProductoPresupuesto = agregarProductoPresupuesto;
window.verPresupuesto = verPresupuesto;
window.descargarPDF = descargarPDF;
window.editarPresupuesto = editarPresupuesto;
window.cambiarEstadoPresupuesto = cambiarEstadoPresupuesto;
window.convertirEnVenta = convertirEnVenta;
window.guardarPresupuesto = guardarPresupuesto;