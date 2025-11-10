async function cargarMovimientos() {
    console.log("cargarMovimientos() ejecutado");

    const tipo = document.getElementById("movimientoTipo").value;
    const fechaInicio = document.getElementById("movimientoFechaInicio").value || null;
    const fechaFin = document.getElementById("movimientoFechaFin").value || null;
    const productoId = document.getElementById("movimientoProductoId")?.value || null;

    const params = new URLSearchParams();

    if (fechaInicio) params.append("fechaInicio", fechaInicio);
    if (fechaFin) params.append("fechaFin", fechaFin);
    if (tipo && tipo !== "TODOS") params.append("tipo", tipo);
    if (productoId) params.append("productoId", productoId);

    const url = params.toString()
        ? `/api/movimientos?${params.toString()}`
        : `/api/movimientos`;

    const response = await fetch(url);
    const data = await response.json();

    console.log("📌 Movimientos recibidos:", data);

    renderMovimientos(data);
}



// Renderizar la tabla
function renderMovimientos(movimientos) {
    const tbody = document.getElementById("movimientosTableBody");
    tbody.innerHTML = "";

    movimientos.forEach(m => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${new Date(m.fechaMovimiento).toLocaleString()}</td>
            <td>${m.producto?.nombre ?? "N/A"}</td>
            <td>${m.tipoMovimiento}</td>
            <td>${m.cantidad}</td>
            <td>${m.cantidadAnterior}</td>
            <td>${m.cantidadNueva}</td>
            <td>${m.observaciones ?? ""}</td>
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