async function cargarMovimientos() {
    console.log("cargarMovimientos() ejecutado");

    const fechaInicio = document.getElementById("movimientoFechaInicio")?.value || "";
    const fechaFin = document.getElementById("movimientoFechaFin")?.value || "";
    let tipo = document.getElementById("movimientoTipo")?.value || "";
    let productoId = document.getElementById("movimientoProductoId").value.trim();

    console.log("Filtros actuales:", { fechaInicio, fechaFin, tipo, productoId });

    // ✅ Si el usuario selecciona “Todos”, no enviamos ese filtro
    if (tipo === "TODOS" || tipo === "" || tipo === null) {
        tipo = null;
    }

    // ✅ PRODUCTO VACÍO = TODOS
    if (productoId === "" || productoId === null) {
        productoId = null;
    }

    const params = new URLSearchParams();

    if (fechaInicio) params.append("fechaInicio", fechaInicio);
    if (fechaFin) params.append("fechaFin", fechaFin);
    if (tipo) params.append("tipo", tipo);
    if (productoId) params.append("productoId", productoId);

    const url = "/api/movimientos" + (params.toString() ? "?" + params.toString() : "");
    console.log("🔗 Fetch URL:", url);

    try {
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            console.error("❌ Error en API Movimientos");
            renderMovimientos([]);
            return;
        }

        const movimientos = await response.json();
        console.log("📌 Movimientos recibidos:", movimientos);

        renderMovimientos(Array.isArray(movimientos) ? movimientos : []);

    } catch (error) {
        console.error("Error al cargar Movimientos", error);
        renderMovimientos([]);
    }
}


// ✅ MOSTRAR MOVIMIENTOS EN LA TABLA
function renderMovimientos(movimientos) {
    // Validación
    if (!Array.isArray(movimientos)) movimientos = [];

    const tbody = document.getElementById("movimientosTableBody"); 
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

    // 🔥 RECARGAR productos del backend
    await cargarProductos();

    // 🔥 Reconstruir selects con stock actual
    cargarProductosParaAjuste();
    cargarProductosFiltro();

    // 🔥 Recargar movimientos
    await cargarMovimientos();

    alert("Ajuste realizado correctamente");
}

// ✅ PRODUCTOS EN SELECTS
function cargarProductosParaAjuste() {
    const select = document.getElementById('productoAjuste');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione un producto</option>';

    // Verificar que window.productos sea un array
    if (!Array.isArray(window.productos)) {
        console.error('window.productos no es un array válido');
        window.productos = [];
        return;
    }

    const productosActivos = window.productos.filter(p => p.estado !== false);

    productosActivos.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto.id;
        option.textContent = `${producto.codigo} - ${producto.nombre} (Stock: ${producto.stockActual || 0})`;
        select.appendChild(option);
    });
}

function cargarProductosFiltro() {
    const select = document.getElementById("movimientoProductoId");
    if (!select || !window.productos) return;

    console.log("🔄 Actualizando productos en FILTRO...");

    select.innerHTML = '<option value="">Todos</option>';

    window.productos
        .filter(p => p.estado === true)
        .forEach(p => {
            select.innerHTML += `<option value="${p.id}">
                ${p.nombre}
            </option>`;
        });
}



// ✅ CARGAR PRODUCTOS
async function cargarProductos() {
    console.log("📦 Cargando productos...");

    const response = await fetch("/api/productos");
    window.productos = await response.json();

    console.log("✅ Productos cargados:", window.productos.length);

}


document.addEventListener("DOMContentLoaded", async () => {
    await cargarProductos();

    cargarProductosParaAjuste();   
    cargarProductosFiltro();      

    document.getElementById("movimientoProductoId").addEventListener("change", () => {
        cargarMovimientos();
    });

    await cargarMovimientos();
});
