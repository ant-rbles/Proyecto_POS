// =======================================================
// =============== VARIABLES PRINCIPALES =================
// =======================================================

// LOGIN
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailGroup = document.getElementById('emailGroup');
const passwordGroup = document.getElementById('passwordGroup');

// RECUPERACIÓN DE CONTRASEÑA
const showForgotPasswordLink = document.getElementById('showForgotPassword');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const backToLoginLink = document.getElementById('backToLogin');
const backToLoginSuccessBtn = document.getElementById('backToLoginSuccess');
const recoveryEmailInput = document.getElementById('recoveryEmail');
const recoveryEmailGroup = document.getElementById('recoveryEmailGroup');
const successView = document.getElementById('successView');
const sentEmailSpan = document.getElementById('sentEmail');

const messageDiv = document.getElementById('message');


// =======================================================
// ===================== UTILIDADES =======================
// =======================================================

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

function validatePassword(password) {
    return typeof password === 'string' && password.length >= 8;
}

function showMessage(msg, type) {
    if (messageDiv) {
        messageDiv.textContent = msg;
        messageDiv.className = type === "success" ? "message success" : "message error";
    }
}

function clearMessage() {
    if (messageDiv) {
        messageDiv.textContent = "";
        messageDiv.className = "";
    }
}

function hideAllForms() {
    loginForm?.classList.add("hidden");
    forgotPasswordForm?.classList.add("hidden");
    if (successView) successView.style.display = "none";
}


// =======================================================
// ========= VALIDACIONES DINÁMICAS (TIEMPO REAL) =========
// =======================================================

emailInput?.addEventListener("input", () => {
    const value = emailInput.value.trim();
    const emailErrorEl = document.getElementById("emailError");

    if (validateEmail(value)) {
        emailGroup?.classList.remove("invalid");
        emailGroup?.classList.add("valid");
        if (emailErrorEl) emailErrorEl.style.display = "none";
    } else {
        emailGroup?.classList.remove("valid");
        emailGroup?.classList.add("invalid");
        if (emailErrorEl) emailErrorEl.style.display = "block";
    }
});

passwordInput?.addEventListener("input", () => {
    const value = passwordInput.value.trim();
    const passwordErrorEl = document.getElementById("passwordError");

    if (validatePassword(value)) {
        passwordGroup?.classList.remove("invalid");
        passwordGroup?.classList.add("valid");
        if (passwordErrorEl) passwordErrorEl.style.display = "none";
    } else {
        passwordGroup?.classList.remove("valid");
        passwordGroup?.classList.add("invalid");
        if (passwordErrorEl) passwordErrorEl.style.display = "block";
    }
});


// =======================================================
// ========================= LOGIN ========================
// =======================================================

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        clearMessage();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const loginBtn = document.getElementById("loginBtn");

        let hasErrors = false;

        // Validación email
        if (!validateEmail(email)) {
            emailGroup.classList.add("invalid");
            document.getElementById("emailError").style.display = "block";
            hasErrors = true;
        } else {
            emailGroup.classList.remove("invalid");
            document.getElementById("emailError").style.display = "none";
        }

        // Validación password
        if (!validatePassword(password)) {
            passwordGroup.classList.add("invalid");
            document.getElementById("passwordError").style.display = "block";
            hasErrors = true;
        } else {
            passwordGroup.classList.remove("invalid");
            document.getElementById("passwordError").style.display = "none";
        }

        if (hasErrors) return;

        // ================= BLOQUEAR BOTÓN =================
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span> Iniciando sesión...';

        // ================= PETICIÓN =================
        try {
            const response = await fetch("https://localhost:7000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login: email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message, "success");

                localStorage.setItem("authToken", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("usuarioId", data.user.id);

                if (typeof showDashboard === "function") {
                    hideAllForms();
                    showDashboard(data.user);
                } else {
                    window.location.href = "index.html";
                }

            } else {
                showMessage(data.message || "Credenciales incorrectas", "error");
            }

        } catch (error) {
            console.error("Login error:", error);
            showMessage("Error de conexión. Intenta nuevamente.", "error");
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "Iniciar Sesión";
        }
    });
}


// =======================================================
// ================== RECUPERAR CONTRASEÑA ================
// =======================================================

showForgotPasswordLink?.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllForms();
    forgotPasswordForm?.classList.remove("hidden");
    clearMessage();
});

backToLoginLink?.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllForms();
    loginForm?.classList.remove("hidden");
    clearMessage();
});

backToLoginSuccessBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllForms();
    loginForm?.classList.remove("hidden");
    clearMessage();
});

forgotPasswordForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    const email = recoveryEmailInput.value.trim();
    const recoveryBtn = document.getElementById("recoveryBtn");

    if (!validateEmail(email)) {
        recoveryEmailGroup.classList.add("invalid");
        showMessage("Por favor ingresa un email válido", "error");
        return;
    }

    recoveryBtn.disabled = true;
    recoveryBtn.innerHTML = '<span class="loading"></span> Enviando...';

    try {
        const response = await fetch("https://localhost:7000/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            hideAllForms();
            successView.style.display = "block";
            sentEmailSpan.textContent = email;
        } else {
            showMessage(data.message || "Error al enviar el correo.", "error");
        }

    } catch (error) {
        console.error("Recovery error:", error);
        showMessage("Error de conexión. Intenta nuevamente.", "error");

    } finally {
        recoveryBtn.disabled = false;
        recoveryBtn.textContent = "Enviar Instrucciones";
    }
});


// =======================================================
// =============== MOSTRAR / OCULTAR PASSWORD =============
// =======================================================

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const toggleBtn = input.parentNode.querySelector(".toggle-password");
    const icon = toggleBtn?.querySelector("i");

    if (input.type === "password") {
        input.type = "text";
        icon?.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon?.classList.replace("fa-eye-slash", "fa-eye");
    }
}


// =======================================================
// ========================= LOGOUT =======================
// =======================================================

function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("usuarioId");
    window.location.href = "index.html";
}

window.logout = logout;


// =======================================================
// ======= AUTOLOGIN: MANTENER SESIÓN ACTIVADA ============
// =======================================================

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user) {

        try {
            // Probar token con una llamada ligera
            const test = await fetch(`https://localhost:7000/api/productos`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            // Token vencido / inválido
            if (test.status === 401) {
                logout();
                return;
            }

            // Token válido → mostrar dashboard sin login
            if (typeof showDashboard === "function") {
                hideAllForms();
                showDashboard(user);
            }

        } catch (error) {
            console.warn("No se pudo verificar token.", error);
        }
    }
});
