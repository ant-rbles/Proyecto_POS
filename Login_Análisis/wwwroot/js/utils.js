// Validación del campo email
function validateEmailField(input, group) {
    if (!group) return;
    if (input.value === '') {
        group.classList.remove('valid', 'invalid');
        return;
    }
    if (validateEmail(input.value)) {
        group.classList.add('valid');
        group.classList.remove('invalid');
    } else {
        group.classList.remove('valid');
        group.classList.add('invalid');
    }
}

// Validación del campo contraseña
function validatePasswordField(input, group) {
    if (!group) return;
    if (input.value === '') {
        group.classList.remove('valid', 'invalid');
        return;
    }
    if (validatePassword(input.value)) {
        group.classList.add('valid');
        group.classList.remove('invalid');
    } else {
        group.classList.remove('valid');
        group.classList.add('invalid');
    }
}

// Validación de email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(email) && email.includes('.');
}

// Longitud mínima de contraseña
function validatePassword(password) {
    return password.length >= 12;
}

// Configurar validación de contraseña
function setupPasswordValidation() {
    const adminPassword = document.getElementById('adminRegPassword');
    const adminConfirmPassword = document.getElementById('adminConfirmPassword');

    if (adminPassword) {
        adminPassword.addEventListener('input', checkAdminPasswordStrength);
        adminPassword.addEventListener('input', checkAdminPasswordMatch);
    }

    if (adminConfirmPassword) {
        adminConfirmPassword.addEventListener('input', checkAdminPasswordMatch);
    }
}

// Función para verificar fortaleza de contraseña
function checkAdminPasswordStrength() {
    const pwd = document.getElementById('adminRegPassword');
    const bar = document.getElementById('adminPasswordStrengthBar');
    if (!pwd || !bar) return;

    const v = pwd.value || '';
    let score = 0;

    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[a-z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;

    const pct = Math.round((score / 5) * 100);
    bar.style.width = pct + '%';

    if (pct < 40) {
        bar.style.backgroundColor = '#e74c3c';
    } else if (pct < 80) {
        bar.style.backgroundColor = '#f39c12';
    } else {
        bar.style.backgroundColor = '#2ecc71';
    }
}

// Función para verificar coincidencia de contraseñas
function checkAdminPasswordMatch() {
    const pwd = document.getElementById('adminRegPassword')?.value || '';
    const conf = document.getElementById('adminConfirmPassword')?.value || '';
    const matchEl = document.getElementById('adminPasswordMatchSuccess');
    const noMatchEl = document.getElementById('adminPasswordMatch');

    if (!matchEl && !noMatchEl) return;

    if (pwd === '' && conf === '') {
        if (matchEl) matchEl.style.display = 'none';
        if (noMatchEl) noMatchEl.style.display = 'none';
        return;
    }

    if (pwd === conf && pwd.length >= 8) {
        if (matchEl) matchEl.style.display = 'block';
        if (noMatchEl) noMatchEl.style.display = 'none';
    } else {
        if (matchEl) matchEl.style.display = 'none';
        if (noMatchEl) noMatchEl.style.display = 'block';
    }
}

// Función para obtener la clase del estado del stock
function getStockStatusClass(stockActual, stockMinimo) {
    if (stockActual <= 0) return 'stock-critical';
    if (stockActual <= stockMinimo) return 'stock-low';
    return 'stock-normal';
}

// Función para obtener el texto del estado del stock
function getStockStatusText(stockActual, stockMinimo) {
    if (stockActual <= 0) return 'Sin Stock';
    if (stockActual <= stockMinimo) return 'Stock Bajo';
    return 'Normal';
}

// Función para calcular totales en tiempo real
function calcularTotalesVentaEnTiempoReal() {
    const detalles = detallesVenta;
    const subtotal = detalles.reduce((sum, detalle) => sum + detalle.totalLinea, 0);
    const impuestos = parseFloat(document.getElementById('ventaImpuestos')?.value) || 0;
    const total = subtotal + impuestos;

    // Actualizar UI
    if (document.getElementById('ventaSubtotal')) {
        document.getElementById('ventaSubtotal').textContent = subtotal.toFixed(2);
    }
    if (document.getElementById('ventaImpuestosTotal')) {
        document.getElementById('ventaImpuestosTotal').textContent = impuestos.toFixed(2);
    }
    if (document.getElementById('ventaTotal')) {
        document.getElementById('ventaTotal').textContent = total.toFixed(2);
    }

    return { subtotal, impuestos, total };
}

// Función para procesar ventas (puede ser utilizada por otros módulos)
async function procesarVenta(ventaData) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(ventaData)
        });

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        } else {
            const error = await response.json();
            return { success: false, error: error.message };
        }
    } catch (error) {
        return { success: false, error: 'Error de conexión' };
    }
}

// Función para calcular descuento por cantidad (ejemplo, se puede modificar)
function calcularDescuentoPorCantidad(productoId, cantidad) {
    // Lógica de descuento por cantidad
    if (cantidad >= 100) return 10;
    if (cantidad >= 50) return 5;
    if (cantidad >= 10) return 2;
    return 0;
}

// Agregar en utils.js
function calcularTotalLinea(cantidad, precioUnitario) {
    const cantidadNum = parseFloat(cantidad) || 0;
    const precioNum = parseFloat(precioUnitario) || 0;
    return (cantidadNum * precioNum).toFixed(2);
}

function mostrarError(mensaje) {
    // Puedes implementar un sistema de notificaciones más elegante
    alert(`Error: ${mensaje}`);
}

function mostrarExito(mensaje) {
    // Puedes implementar un sistema de notificaciones más elegante
    alert(`Éxito: ${mensaje}`);
}