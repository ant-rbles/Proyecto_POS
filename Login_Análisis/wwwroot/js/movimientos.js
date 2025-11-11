// ✅ CARGAR MOVIMIENTOS DESDE LA API
async function cargarMovimientos() {
    console.log("cargarMovimientos() ejecutado");

    try {
        const tipo = document.getElementById("movimientoTipo")?.value;
        const fechaInicio = document.getElementById("movimientoFechaInicio")?.value || null;
        const fechaFin = document.getElementById("movimientoFechaFin")?.value || null;
        const productoId = document.getElementById("movimientoProductoId")?.value || null;

        const params = new URLSearchParams();

        // ✅ Fechas (solo si son válidas)
        if (fechaInicio && fechaFin && fechaInicio <= fechaFin) {
            params.append("fechaInicio", fechaInicio);
            params.append("fechaFin", fechaFin);
        }

        // ✅ Tipo de movimiento (solo si no es TODOS)
        if (tipo && tipo !== "TODOS") {
            params.append("tipo", tipo);
        }

        // ✅ Producto
        if (productoId) params.append("productoId", productoId);

        const url = params.toString()
            ? `/api/movimientos?${params.toString()}`
            : `/api/movimientos`;

        console.log("🔗 Fetch URL:", url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error("❌ Error en la API de Movimientos");
            renderMovimientos([]);
            return;
        }

        const movimientos = await response.json();
        console.log("📌 Movimientos recibidos:", movimientos);

        renderMovimientos(movimientos);

    } catch (err) {
        console.error("Error en cargarMovimientos:", err);
        renderMovimientos([]);
    }
}

// ✅ MOSTRAR MOVIMIENTOS EN LA TABLA
function renderMovimientos(movimientos) {
    // Validación
    if (!Array.isArray(movimientos)) movimientos = [];

    const tbody = document.getElementById("movimientosTableBody"); // ✅ ESTE ID SÍ EXISTE EN TU INDEX
    tbody.innerHTML = "";

    if (movimientos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data">No hay movimientos para mostrar</td></tr>`;
        return;
    }

    movimientos.forEach(m => {
        const tr = document.createElement("tr");

        const fecha = m.fechaMovimiento
            ? new Date(m.fechaMovimiento).toLocaleString()
            : "N/A";

        const productoNombre = m.producto?.nombre || "Desconocido";

        tr.innerHTML = `
            <td>${fecha}</td>
            <td>${productoNombre}</td>
            <td>${m.tipoMovimiento}</td>
            <td>${m.cantidad}</td>
            <td>${m.cantidadAnterior ?? 0}</td>
            <td>${m.cantidadNueva ?? 0}</td>
            <td>${m.observaciones ?? ""}</td>
        `;

        tbody.appendChild(tr);
    });
}



// ✅ FORMULARIO DE AJUSTE

function showAjusteForm() {
    document.getElementById("ajusteForm").style.display = "block";
}

function hideAjusteForm() {
    document.getElementById("ajusteForm").style.display = "none";
}

async function guardarAjuste() {
    const productoId = document.getElementById("ajusteProductoId").value;
    const cantidad = document.getElementById("ajusteCantidad").value;
    const tipo = document.getElementById("ajusteTipo").value;

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

    const response = await fetch("/api/movimientos/ajuste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) return alert("Error al guardar el ajuste");

    hideAjusteForm();

    await cargarProductos();
    await cargarMovimientos();
}



// ✅ PRODUCTOS EN SELECTS
function cargarProductosParaAjuste() {
    console.log("🔄 cargarProductosParaAjuste ejecutado");

    const select = document.getElementById("ajusteProductoId");
    if (!select) return;

    if (!window.productos || window.productos.length === 0) return;

    select.innerHTML =
        '<option value="">Seleccionar producto</option>' +
        window.productos
            .filter(p => p.estado === true)
            .map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stockActual})</option>`)
            .join('');
}

function cargarProductosFiltro() {
    const select = document.getElementById("movimientoProductoId");
    if (!select || !window.productos) return;

    select.innerHTML =
        '<option value="">Todos</option>' +
        window.productos
            .filter(p => p.estado === true)
            .map(p => `<option value="${p.id}">${p.nombre}</option>`)
            .join('');
}


// ✅ CARGAR PRODUCTOS
async function cargarProductos() {
    console.log("📦 Cargando productos...");

    const response = await fetch("/api/productos");
    window.productos = await response.json();

    console.log("✅ Productos cargados:", window.productos.length);

    cargarProductosParaAjuste();
    cargarProductosFiltro();
}


document.addEventListener("DOMContentLoaded", async () => {
    await cargarProductos();

    document.getElementById("movimientoProductoId").addEventListener("change", () => {
        cargarMovimientos();
    });

    await cargarMovimientos();
});
