async function cargarMovimientos() {
    console.log("cargarMovimientos() ejecutado");

    try {
        const tipo = document.getElementById("movimientoTipo")?.value;
        const fechaInicio = document.getElementById("movimientoFechaInicio")?.value || null;
        const fechaFin = document.getElementById("movimientoFechaFin")?.value || null;
        const productoId = document.getElementById("movimientoProductoId")?.value || null;

        const params = new URLSearchParams();

        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        if (tipo && tipo !== "TODOS") params.append("tipo", tipo);
        if (productoId) params.append("productoId", productoId);

        const url = params.toString() ? `/api/movimientos?${params.toString()}` : `/api/movimientos`;
        console.log("🔗 Fetch URL:", url);

        const response = await fetch(url);

        // Si la API devolvió error (400/500/etc) -> loguear y mostrar tabla vacía
        if (!response.ok) {
            // Intentar leer texto/JSON con tolerancia para mostrar mensaje del servidor
            let text;
            try {
                // Algunos servidores devuelven JSON { Message: "..." }
                text = await response.text();
                try {
                    const maybeJson = JSON.parse(text);
                    console.warn("⚠️ API MOVIMIENTOS returned error JSON:", maybeJson);
                    // Si viene { Message: "..."} mostramos alerta opcional
                    if (maybeJson && (maybeJson.Message || maybeJson.message)) {
                        console.error("Error API:", maybeJson.Message || maybeJson.message);
                    }
                } catch (e) {
                    console.warn("⚠️ API MOVIMIENTOS returned non-JSON error:", text);
                }
            } catch (errText) {
                console.warn("No se pudo leer body de la respuesta de error:", errText);
            }

            // Mostrar tabla vacía para no romper UI
            renderMovimientos([]);
            return;
        }

        // Si response.ok -> parsear JSON
        const data = await response.json();
        console.log("📌 Movimientos recibidos (raw):", data);

        // Normalizar: puede venir directamente un array o un objeto que contiene la colección
        let movimientos;
        if (Array.isArray(data)) {
            movimientos = data;
        } else if (data && Array.isArray(data.data)) {
            movimientos = data.data;
        } else if (data && Array.isArray(data.movimientos)) {
            // por si el backend usa una propiedad distinta
            movimientos = data.movimientos;
        } else {
            // Si llegó un objeto simple (p.ej. { Message: "..." }) -> avisar y vaciar
            console.warn("La respuesta no es un array. Se mostrará tabla vacía. Respuesta:", data);
            movimientos = [];
        }

        renderMovimientos(movimientos);
    } catch (err) {
        console.error("Error en cargarMovimientos:", err);
        renderMovimientos([]); // fallback para no romper la UI
    }
}

function renderMovimientos(movimientos) {
    // defensivo: asegurar que movimientos sea array
    if (!Array.isArray(movimientos)) {
        console.warn("renderMovimientos recibió un valor no iterable, convirtiendo a array vacío.", movimientos);
        movimientos = [];
    }

    const tbody = document.getElementById("movimientosTableBody");
    if (!tbody) {
        console.error("No se encontró #movimientosTableBody en el DOM.");
        return;
    }
    tbody.innerHTML = "";

    if (movimientos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data">No hay movimientos para mostrar</td></tr>`;
        return;
    }

    movimientos.forEach(m => {
        const tr = document.createElement("tr");

        // defensiva: si propiedades faltan, usar valores seguros
        const fecha = m?.fechaMovimiento ? new Date(m.fechaMovimiento).toLocaleString() : "N/A";
        const productoNombre = m?.producto?.nombre ?? (m?.productoNombre ?? "N/A");
        const tipo = m?.tipoMovimiento ?? (m?.TipoMovimiento ?? "N/A");
        const cantidad = m?.cantidad ?? 0;
        const cantidadAnterior = m?.cantidadAnterior ?? (m?.CantidadAnterior ?? 0);
        const cantidadNueva = m?.cantidadNueva ?? (m?.CantidadNueva ?? 0);
        const observaciones = m?.observaciones ?? "";

        tr.innerHTML = `
            <td>${fecha}</td>
            <td>${productoNombre}</td>
            <td>${tipo}</td>
            <td>${cantidad}</td>
            <td>${cantidadAnterior}</td>
            <td>${cantidadNueva}</td>
            <td>${observaciones}</td>
        `;
        tbody.appendChild(tr);
    });
}


// Mostrar formulario de ajuste
function showAjusteForm() {
    document.getElementById("ajusteForm").style.display = "block";
}

// Ocultar formulario de ajuste
function hideAjusteForm() {
    document.getElementById("ajusteForm").style.display = "none";
}

// Guardar un ajuste de inventario
async function guardarAjuste() {
    const productoId = document.getElementById("ajusteProductoId").value;
    const cantidad = document.getElementById("ajusteCantidad").value;
    const tipo = document.getElementById("ajusteTipo").value;

    if (!productoId) {
        alert("Seleccione un producto");
        return;
    }

    if (!cantidad || Number(cantidad) === 0) {
        alert("Ingrese una cantidad válida");
        return;
    }

    const usuario = JSON.parse(localStorage.getItem("user"));

    const body = {
        productoId: Number(productoId),
        cantidad: tipo === "SALIDA" ? Number(cantidad) * -1 : Number(cantidad),
        observaciones: "Ajuste manual",
        usuarioId: usuario?.id || 1,
        tipo: "AJUSTE" 
    };

    const response = await fetch("/api/movimientos/ajuste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (response.ok) {
        hideAjusteForm();
        cargarMovimientos();
    } else {
        alert("Error al guardar el ajuste");
    }
}

function cargarProductosParaAjuste() {
    console.log("🔄 cargarProductosParaAjuste ejecutado");
    const select = document.getElementById("ajusteProductoId");
    if (!select) {
        console.warn("⚠️ No se encontró el select ajusteProductoId");
        return;
    }

    if (!window.productos || window.productos.length === 0) {
        console.warn("⚠️ No hay productos cargados todavía, esperando...");
        return;
    }

    select.innerHTML =
        '<option value="">Seleccionar producto</option>' +
        window.productos
            .filter(p => p.estado === true)
            .map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stockActual})</option>`)
            .join('');

    console.log("✅ Productos cargados en ajuste:", window.productos.length);
}

function cargarProductosFiltro() {
    const select = document.getElementById("movimientoProductoId");
    if (!select || !window.productos || window.productos.length === 0) return;

    select.innerHTML =
        '<option value="">Todos</option>' +
        window.productos
            .filter(p => p.estado === true)
            .map(p => `<option value="${p.id}">${p.nombre}</option>`)
            .join('');
}

// ✅ Cargar productos desde la API
async function cargarProductos() {
    console.log("📦 Cargando productos...");
    const response = await fetch("/api/productos");
    window.productos = await response.json();
    console.log("✅ Productos cargados:", window.productos.length);

    // Llenar selects ahora que ya están cargados
    cargarProductosParaAjuste();
    cargarProductosFiltro();
}

// ✅ Llamar la carga cuando se abra la pantalla
document.addEventListener("DOMContentLoaded", cargarProductos);