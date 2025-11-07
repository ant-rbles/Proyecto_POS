// utils.js - Funciones de utilidad general

// Formateadores
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ'
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('es-GT');
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('es-GT');
}

// Validaciones
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(email) && email.includes('.');
}

function isValidPassword(password) {
    return password.length >= 8;
}

// Helpers de arrays
function findById(array, id) {
    return array.find(item => item.id === id);
}

function filterActive(items) {
    return items.filter(item => item.estado !== false);
}

// Mostrar mensajes
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) {
        // Crear elemento si no existe
        const newMessageDiv = document.createElement('div');
        newMessageDiv.id = 'message';
        newMessageDiv.className = `message ${type}`;
        newMessageDiv.textContent = message;
        newMessageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        if (type === 'success') {
            newMessageDiv.style.background = '#28a745';
        } else if (type === 'error') {
            newMessageDiv.style.background = '#dc3545';
        } else if (type === 'warning') {
            newMessageDiv.style.background = '#ffc107';
            newMessageDiv.style.color = '#212529';
        } else {
            newMessageDiv.style.background = '#17a2b8';
        }

        document.body.appendChild(newMessageDiv);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            newMessageDiv.remove();
        }, 5000);
        return;
    }

    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    // Ocultar después de 5 segundos
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Limpiar mensajes
function clearMessage() {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// Helpers para API
async function apiCall(url, options = {}) {
    const authToken = localStorage.getItem('authToken');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Validación de formularios en tiempo real
function setupFieldValidation(inputElement, validationFn, errorMessage) {
    const group = inputElement.closest('.form-group');
    if (!group) return;

    inputElement.addEventListener('blur', () => {
        if (inputElement.value.trim() === '') {
            group.classList.remove('valid', 'invalid');
            return;
        }

        if (validationFn(inputElement.value)) {
            group.classList.add('valid');
            group.classList.remove('invalid');
        } else {
            group.classList.remove('valid');
            group.classList.add('invalid');
        }
    });
}

// Toggle password visibility
function setupPasswordToggle() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.toggle-password')) {
            const toggle = e.target.closest('.toggle-password');
            const input = toggle.closest('.form-group').querySelector('input');
            const icon = toggle.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    });
}

// Cargar selects con datos
function populateSelect(selectElement, data, valueField = 'id', textField = 'nombre', placeholder = 'Seleccionar...') {
    if (!selectElement) return;

    selectElement.innerHTML = `<option value="">${placeholder}</option>` +
        data.map(item =>
            `<option value="${item[valueField]}">${item[textField]}</option>`
        ).join('');
}

// Debounce para búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Inicializar utilidades cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    setupPasswordToggle();
});