// ELEMENTOS DEL DOM
const loginForm = document.getElementById('loginForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const successView = document.getElementById('successView');
const dashboard = document.getElementById('dashboard');
const userRegistrationForm = document.getElementById('userRegistrationForm');
const showForgotPasswordLink = document.getElementById('showForgotPassword');
const backToLoginLink = document.getElementById('backToLogin');
const backToLoginSuccessBtn = document.getElementById('backToLoginSuccess');
const messageDiv = document.getElementById('message');
const sentEmailSpan = document.getElementById('sentEmail');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const recoveryEmailInput = document.getElementById('recoveryEmail');
const emailGroup = document.getElementById('emailGroup');
const passwordGroup = document.getElementById('passwordGroup');
const recoveryEmailGroup = document.getElementById('recoveryEmailGroup');

// Variables globales
let currentSection = 'welcome';
let proveedores = [];
let clientes = [];
let ventas = [];
let productos = [];
let categorias = [];
let compras = [];
let unidadesMedida = [];
let detallesVenta = [];
let detallesCompra = [];
let currentProveedorId = null;
let currentProductoId = null;
let currentCategoriaId = null;
let currentClienteId = null;
let currentUnidadId = null;
let currentVentaId = null;

// Cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (authToken && user) showDashboard(user);
    setupValidation();
    setupPasswordValidation();
});

// Configuración inicial
function setupValidation() {
    if (emailInput) {
        emailInput.addEventListener('input', () => validateEmailField(emailInput, emailGroup));
        emailInput.addEventListener('blur', () => validateEmailField(emailInput, emailGroup));
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', () => validatePasswordField(passwordInput, passwordGroup));
        passwordInput.addEventListener('blur', () => validatePasswordField(passwordInput, passwordGroup));
    }
    if (recoveryEmailInput) {
        recoveryEmailInput.addEventListener('input', () => validateEmailField(recoveryEmailInput, recoveryEmailGroup));
        recoveryEmailInput.addEventListener('blur', () => validateEmailField(recoveryEmailInput, recoveryEmailGroup));
    }
}

// Mostrar mensajes
function showMessage(text, type) {
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(clearMessage, 5000);
}

// Limpiar mensajes
function clearMessage() {
    if (!messageDiv) return;
    messageDiv.style.display = 'none';
    messageDiv.className = 'message';
}

// Oculta todos los formularios principales
function hideAllForms() {
    if (loginForm) loginForm.classList.add('hidden');
    if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
    if (successView) successView.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
}

// Configurar event listeners para gestión
function setupManagementEventListeners() {
    console.log('Configurando event listeners de gestión...');

    // Formulario de proveedores
    const proveedorForm = document.getElementById('proveedorFormElement');
    if (proveedorForm) {
        proveedorForm.addEventListener('submit', handleProveedorSubmit);
    }

    // Formulario de productos
    const productoForm = document.getElementById('productoFormElement');
    if (productoForm) {
        productoForm.addEventListener('submit', handleProductoSubmit);
    }

    // Formulario de compras
    const compraForm = document.getElementById('compraFormElement');
    if (compraForm) {
        compraForm.addEventListener('submit', handleCompraSubmit);
    }

    // Formulario de categorías
    const categoriaForm = document.getElementById('categoriaFormElement');
    if (categoriaForm) {
        categoriaForm.addEventListener('submit', handleCategoriaSubmit);
    }

    // Formulario de unidades de medida
    const unidadForm = document.getElementById('unidadFormElement');
    if (unidadForm) {
        unidadForm.addEventListener('submit', handleUnidadSubmit);
    }

    // Formulario de ventas
    const ventaForm = document.getElementById('ventaFormElement');
    if (ventaForm) {
        ventaForm.addEventListener('submit', handleVentaSubmit);
    }

    // Eventos para detalles de compra
    const detalleCantidad = document.getElementById('detalleCantidad');
    const detallePrecio = document.getElementById('detallePrecio');
    const compraImpuestos = document.getElementById('compraImpuestos');

    if (detalleCantidad) detalleCantidad.addEventListener('input', calcularTotalLinea);
    if (detallePrecio) detallePrecio.addEventListener('input', calcularTotalLinea);
    if (compraImpuestos) compraImpuestos.addEventListener('input', calcularTotalesCompra);
}