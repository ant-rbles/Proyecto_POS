// wwwroot/js/movimientos.js
// Movimientos - versión corregida y robusta
// Reemplaza el archivo completo por este contenido.

// ----------------------------- UTILIDADES -----------------------------
const API_PREFIX = '/api';

// Obtiene token guardado en localStorage (soporta 'authToken' y 'token')
function getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('token') || null;
}

// Helper para realizar fetch con Authorization si hay token
async function fetchWithOptionalAuth(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        ...(options.headers || {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const merged = { ...options, headers };
    return await fetch(`${API_PREFIX}${endpoint}`, merged);
}

// ----------------------------- CARGAR MOVIMIENTOS -----------------------------
async function cargarMovimientos() {
    console.log("cargarMovimientos() ejecutado");

    const fechaInicio = document.getElementById("movimientoFechaInicio")?.value || "";
    const fechaFin = document.getElementById("movimientoFechaFin")?.value || "";
    let tipo = document.getElementById("movimientoTipo")?.value || "";
    let productoIdEl = document.getElementById("movimientoProductoId");
    let productoId = productoIdEl ? productoIdEl.value.trim() : null;

    console.log("Filtros actuales:", { fechaInicio, fechaFin, tipo, productoId });

    if (tipo === "TODOS" || tipo === "" || tipo === null) tipo = null;
    if (productoId === "" || productoId === null) productoId = null;

    const params = new URLSearchParams();
    if (fechaInicio) params.append("fechaInicio", fechaInicio);
    if (fechaFin) params.append("fechaFin", fechaFin);
    if (tipo) params.append("tipo", tipo);
    if (productoId) params.append("productoId", productoId);

    const url = "/movimientos" + (params.toString() ? "?" + params.toString() : "");
    // Nota: fetchWithOptionalAuth añade el prefijo /api internamente.
    console.log("🔗 Fetch URL (API):", `${API_PREFIX}${url}`);

    try {
        const response = await fetchWithOptionalAuth(url, { cache: "no-store", method: "GET" });

        if (!response) {
            console.error("No hubo respuesta de la API Movimientos");
            renderMovimientos([]);
            return;
        }

        if (response.status === 401) {
            console.warn("401 recibido al cargar movimientos - token inválido o sesión expiró");
            // Puedes mostrar mensaje de sesión expirada aquí si tienes showMessage
            if (typeof showMessage === 'function') showMessage('Sesión expirada o no autorizada', 'error');
            renderMovimientos([]);
            return;
        }

        if (!response.ok) {
            console.error("❌ Error en API Movimientos:", response.status);
            renderMovimientos([]);
            return;
        }

        const movimientos = await response.json();
        console.log("📌 Movimientos recibidos:", movimientos);

        renderMovimientos(Array.isArray(movimientos) ? movimientos : (Array.isArray(movimientos.data) ? movimientos.data : []));
    } catch (error) {
        console.error("Error al cargar Movimientos", error);
        renderMovimientos([]);
    }
}

// ----------------------------- RENDER MOVIMIENTOS -----------------------------
function renderMovimientos(movimientos) {
    if (!Array.isArray(movimientos)) movimientos = [];

    const tbody = document.getElementById("movimientosTableBody");
    if (!tbody) {
        console.warn("movimientosTableBody no encontrado en DOM");
        return;
    }

    tbody.innerHTML = "";

    if (movimientos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data">No hay movimientos para mostrar</td></tr>`;
        return;
    }

    movimientos.forEach(m => {
        const tr = document.createElement("tr");

        const fecha = m.fechaMovimiento
            ? new Date(m.fechaMovimiento).toLocaleString()
            : (m.fecha ? new Date(m.fecha).toLocaleString() : "N/A");

        const productoNombre = m.producto?.nombre || m.nombreProducto || "Desconocido";

        tr.innerHTML = `
            <td>${fecha}</td>
            <td>${productoNombre}</td>
            <td>${m.tipoMovimiento || m.tipo || ''}</td>
            <td>${m.cantidad ?? 0}</td>
            <td>${m.cantidadAnterior ?? 0}</td>
            <td>${m.cantidadNueva ?? 0}</td>
            <td>${m.observaciones ?? ""}</td>
        `;

        tbody.appendChild(tr);
    });
}

// ----------------------------- FORMULARIO AJUSTE -----------------------------
function showAjusteForm() {
    const form = document.getElementById("ajusteForm");
    if (form) form.style.display = "block";
}

function hideAjusteForm() {
    const form = document.getElementById("ajusteForm");
    if (form) form.style.display = "none";
}

async function guardarAjuste() {
    const productoId = document.getElementById("ajusteProductoId")?.value;
    const cantidad = document.getElementById("ajusteCantidad")?.value;
    const tipo = document.getElementById("ajusteTipo")?.value;

    if (!productoId) return alert("Seleccione un producto");
    if (!cantidad || Number(cantidad) <= 0) return alert("Ingrese una cantidad válida");

    const usuario = JSON.parse(localStorage.getItem("user")) || { id: 1 };

    const body = {
        productoId: Number(productoId),
        cantidad: Number(cantidad),
        observaciones: "Ajuste manual",
        usuarioId: usuario.id,
        tipo: tipo
    };

    try {
        const resp = await fetchWithOptionalAuth("/movimientos/ajuste", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!resp) throw new Error("No response");
        if (resp.status === 401) return alert("No autorizado para guardar ajuste");

        if (!resp.ok) {
            const text = await resp.text().catch(() => null);
            console.error("Error guardando ajuste:", resp.status, text);
            return alert("Error al guardar el ajuste");
        }

        hideAjusteForm();

        // RECARGAR productos y movimientos
        await cargarProductos();
        cargarProductosParaAjuste();
        cargarProductosFiltro();
        await cargarMovimientos();

        alert("Ajuste realizado correctamente");
    } catch (err) {
        console.error("guardarAjuste error:", err);
        alert("Error al guardar el ajuste");
    }
}

// ----------------------------- PRODUCTOS EN SELECTS -----------------------------
function cargarProductosParaAjuste() {
    const select = document.getElementById("ajusteProductoId");
    if (!select) return;

    console.log("🔄 Actualizando productos para AJUSTE...");

    select.innerHTML = '<option value="">Seleccionar producto</option>';

    const lista = Array.isArray(window.productos) ? window.productos : [];
    lista.filter(p => p.estado === true).forEach(p => {
        select.innerHTML += `<option value="${p.id}">
            ${p.nombre} (Stock: ${p.stockActual ?? 0})
        </option>`;
    });
}

function cargarProductosFiltro() {
    const select = document.getElementById("movimientoProductoId");
    if (!select) return;

    console.log("🔄 Actualizando productos en FILTRO...");

    select.innerHTML = '<option value="">Todos</option>';

    const lista = Array.isArray(window.productos) ? window.productos : [];
    lista.filter(p => p.estado === true).forEach(p => {
        select.innerHTML += `<option value="${p.id}">
            ${p.nombre}
        </option>`;
    });
}

// ----------------------------- CARGAR PRODUCTOS -----------------------------
async function cargarProductos() {
    console.log("📦 Cargando productos...");

    try {
        const resp = await fetchWithOptionalAuth("/productos", { method: "GET", cache: "no-store" });

        if (!resp) {
            console.error("No se obtuvo respuesta al cargar productos");
            window.productos = [];
            return;
        }

        if (resp.status === 401) {
            console.warn("401 en /api/productos - token inválido o sesión expirada");
            window.productos = [];
            return;
        }

        if (!resp.ok) {
            console.error("Error al obtener productos:", resp.status);
            // intentar parsear json alternativo
            const txt = await resp.text().catch(() => null);
            console.warn("Respuesta no OK productos:", txt);
            window.productos = [];
            return;
        }

        const data = await resp.json();

        // Normalizar: admitir distintos formatos retornados por la API
        if (Array.isArray(data)) {
            window.productos = data;
        } else if (Array.isArray(data.productos)) {
            window.productos = data.productos;
        } else if (Array.isArray(data.data)) {
            window.productos = data.data;
        } else {
            // si es objeto con claves numéricas, convertir a array
            try {
                const maybeArray = Object.values(data).filter(v => v && typeof v === 'object');
                window.productos = Array.isArray(maybeArray) ? maybeArray : [];
            } catch (e) {
                window.productos = [];
            }
        }

        console.log("✅ Productos cargados:", Array.isArray(window.productos) ? window.productos.length : 0);
    } catch (err) {
        console.error("Error cargando productos:", err);
        window.productos = [];
    }
}

// ----------------------------- INIT / EVENTOS DOM -----------------------------
document.addEventListener("DOMContentLoaded", async () => {
    // Cargar productos primero para poblar selects
    await cargarProductos();

    // Reconstruir selects usando los productos cargados
    try { cargarProductosParaAjuste(); } catch (e) { console.error(e); }
    try { cargarProductosFiltro(); } catch (e) { console.error(e); }

    // Listener: cambio de filtro de producto
    const filtroProductoEl = document.getElementById("movimientoProductoId");
    if (filtroProductoEl) {
        filtroProductoEl.addEventListener("change", () => {
            cargarMovimientos();
        });
    }

    // Otros listeners de filtros (si existen)
    const inicioEl = document.getElementById("movimientoFechaInicio");
    const finEl = document.getElementById("movimientoFechaFin");
    const tipoEl = document.getElementById("movimientoTipo");
    if (inicioEl) inicioEl.addEventListener("change", () => cargarMovimientos());
    if (finEl) finEl.addEventListener("change", () => cargarMovimientos());
    if (tipoEl) tipoEl.addEventListener("change", () => cargarMovimientos());

    // Cargar inicialmente movimientos
    await cargarMovimientos();
});

// ----------------------------- EXPORTS GLOBALES (por si los invocas desde HTML) -----------------------------
window.cargarMovimientos = cargarMovimientos;
window.cargarProductos = cargarProductos;
window.cargarProductosFiltro = cargarProductosFiltro;
window.cargarProductosParaAjuste = cargarProductosParaAjuste;
window.guardarAjuste = guardarAjuste;
