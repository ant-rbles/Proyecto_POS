window.tarjetas = window.tarjetas || [];

const API_TARJETAS = "/api/TarjetasRegalo";

function loadTarjetas() {
    return fetch(API_TARJETAS, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('authToken') || ''}` }
    })
        .then(r => r.json())
        .then(json => {
            window.tarjetas = Array.isArray(json) ? json : [];
            renderTarjetasTable();
            return window.tarjetas;
        })
        .catch(err => {
            console.error("Error cargando tarjetas:", err);
            window.tarjetas = [];
            renderTarjetasTable();
        });
}

function renderTarjetasTable() {
    const tbody = document.getElementById("tarjetasTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    window.tarjetas.forEach(t => {
        const tr = document.createElement("tr");
        const fechaEmi = t.fechaEmision ? t.fechaEmision.substring(0, 10) : "";
        const fechaExp = t.fechaExpiracion ? t.fechaExpiracion.substring(0, 10) : "";
        const estado = t.estado || "Activa";
        tr.innerHTML = `
      <td>${t.codigo || ""}</td>
      <td class="text-right">Q${(parseFloat(t.montoInicial) || 0).toFixed(2)}</td>
      <td class="text-right">Q${(parseFloat(t.saldoActual) || 0).toFixed(2)}</td>
      <td>${t.moneda || ""}</td>
      <td>${fechaEmi}</td>
      <td>${fechaExp}</td>
      <td><span class="badge">${estado}</span></td>
      <td>
        <button class="btn-sm btn-warning" onclick="editTarjeta(${t.id})">Editar</button>
        <button class="btn-sm btn-danger" onclick="deleteTarjeta(${t.id})">Anular</button>
      </td>
    `;
        tbody.appendChild(tr);
    });
}

function showTarjetaForm() {
    document.getElementById('tarjetaFormContainer').style.display = 'block';
    document.getElementById('btnShowTarjetaForm').style.display = 'none';
    document.getElementById('btnHideTarjetaForm').style.display = 'inline-block';
}

function hideTarjetaForm() {
    document.getElementById('tarjetaFormContainer').style.display = 'none';
    document.getElementById('btnShowTarjetaForm').style.display = 'inline-block';
    document.getElementById('btnHideTarjetaForm').style.display = 'none';
    document.getElementById('tarjetaForm').reset();
    document.getElementById('tarjetaId').value = "";
}

function editTarjeta(id) {
    const t = window.tarjetas.find(x => x.id === id);
    if (!t) return;
    document.getElementById('tarjetaId').value = t.id;
    document.getElementById('codigo').value = t.codigo || "";
    document.getElementById('montoInicial').value = t.montoInicial ?? 0;
    document.getElementById('saldoActual').value = t.saldoActual ?? 0;
    document.getElementById('moneda').value = t.moneda || "GTQ";
    if (t.fechaExpiracion) document.getElementById('fechaExpiracion').value = t.fechaExpiracion.substring(0, 10);
    showTarjetaForm();
}

function deleteTarjeta(id) {
    if (!confirm("¿Anular tarjeta?")) return;
    fetch(`${API_TARJETAS}/${id}?usuarioId=${localStorage.getItem('userId') || ''}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('authToken') || ''}` }
    })
        .then(r => r.json().catch(() => null))
        .then(() => loadTarjetas())
        .catch(err => console.error(err));
}

function bindTarjetasEvents() {
    const btnShow = document.getElementById("btnShowTarjetaForm");
    const btnHide = document.getElementById("btnHideTarjetaForm");
    const btnCancel = document.getElementById("btnCancelTarjeta");
    const form = document.getElementById("tarjetaForm");

    if (btnShow) btnShow.addEventListener("click", showTarjetaForm);
    if (btnHide) btnHide.addEventListener("click", hideTarjetaForm);
    if (btnCancel) btnCancel.addEventListener("click", hideTarjetaForm);

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            const id = document.getElementById('tarjetaId').value;
            const payload = {
                codigo: document.getElementById('codigo').value,
                montoInicial: parseFloat(document.getElementById('montoInicial').value) || 0,
                saldoActual: parseFloat(document.getElementById('saldoActual').value) || 0,
                moneda: document.getElementById('moneda').value || "GTQ",
                fechaExpiracion: document.getElementById('fechaExpiracion').value
            };

            const opts = {
                method: id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('authToken') || ''}`
                },
                body: JSON.stringify(payload)
            };

            const url = id ? `${API_TARJETAS}/${id}` : API_TARJETAS;
            fetch(url, opts)
                .then(r => r.json().catch(() => null))
                .then(() => {
                    hideTarjetaForm();
                    loadTarjetas();
                })
                .catch(err => console.error(err));
        });
    }
}

function initTarjetasModule() {
    setTimeout(() => {
        bindTarjetasEvents();
        loadTarjetas();
    }, 10);
}
