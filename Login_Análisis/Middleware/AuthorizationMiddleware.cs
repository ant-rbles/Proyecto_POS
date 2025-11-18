using Login_Análisis.Constants;
using System.Security.Claims;

namespace Login_Análisis.Middleware
{
    public class AuthorizationMiddleware
    {
        private readonly RequestDelegate _next;

        public AuthorizationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Solo aplicar a rutas API
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                var user = context.User;
                if (user.Identity.IsAuthenticated)
                {
                    var role = user.FindFirst(ClaimTypes.Role)?.Value;

                    if (!string.IsNullOrEmpty(role))
                    {
                        // Verificar permisos según la ruta y el rol
                        var path = context.Request.Path.ToString().ToLower();
                        var method = context.Request.Method;

                        if (!TienePermiso(role, path, method))
                        {
                            context.Response.StatusCode = 403;
                            await context.Response.WriteAsJsonAsync(new
                            {
                                Message = "No tiene permisos para acceder a este recurso",
                                Rol = role,
                                Recurso = path,
                                Metodo = method
                            });
                            return;
                        }
                    }
                }
            }

            await _next(context);
        }

        private bool TienePermiso(string role, string path, string method)
        {
            // Rutas públicas (acceso sin autenticación)
            if (path.Contains("/api/auth/login") ||
                path.Contains("/api/auth/register") ||
                path.Contains("/reset-password"))
            {
                return true;
            }

            // ADMINISTRADOR - Acceso completo a todo
            if (role == Roles.Administrador)
                return true;

            // CAJERO - Permisos específicos
            if (role == Roles.Cajero)
            {
                if (path.Contains("/api/ventas") && method == "POST") return true; // Crear ventas
                if (path.Contains("/api/ventas") && method == "GET") return true;  // Ver ventas
                if (path.Contains("/api/ventas") && path.Contains("/pdf")) return true; // Facturas PDF
                if (path.Contains("/api/clientes") && method == "GET") return true; // Consultar clientes
                if (path.Contains("/api/clientes") && method == "POST") return true; // Crear clientes
                if (path.Contains("/api/productos") && method == "GET") return true; // Consultar productos
                if (path.Contains("/api/inventario") && method == "GET") return true; // Consultar inventario
                if (path.Contains("/api/movimientos") && method == "GET") return true; // Ver movimientos
                if (path.Contains("/api/reportes") && method == "GET") return true; // Generar reportes

                return false;
            }

            // VENDEDOR - Permisos específicos
            if (role == Roles.Vendedor)
            {
                if (path.Contains("/api/inventario") && method == "GET") return true; // Consultar inventario
                if (path.Contains("/api/productos") && method == "GET") return true; // Consultar productos
                if (path.Contains("/api/clientes") && method == "GET") return true; // Consultar clientes
                if (path.Contains("/api/presupuestos") && method == "POST") return true; // Crear presupuestos
                if (path.Contains("/api/presupuestos") && method == "GET") return true; // Ver presupuestos

                return false;
            }

            return false;
        }
    }
}