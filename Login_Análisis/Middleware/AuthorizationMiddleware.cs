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
                        if (!TienePermiso(role, path, context.Request.Method))
                        {
                            context.Response.StatusCode = 403;
                            await context.Response.WriteAsJsonAsync(new
                            {
                                Message = "No tiene permisos para acceder a este recurso"
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
            // Rutas públicas
            if (path.Contains("/api/auth/login") ||
                path.Contains("/api/auth/register") ||
                path.Contains("/reset-password"))
            {
                return true;
            }

            // 🔥 Solo ADMIN puede ver estadísticas de ventas
            if (path.Contains("/api/ventas/estadisticas") && role == Roles.Administrador)
                return true;

            return (role, path) switch
            {
                // Administrador - acceso completo
                (Roles.Administrador, _) => true,

                // Cajero - solo ventas, inventario (consulta) y reportes
                (Roles.Cajero, string p) when p.Contains("/api/ventas") => true,
                (Roles.Cajero, string p) when p.Contains("/api/movimientos") && method == "GET" => true,
                (Roles.Cajero, string p) when p.Contains("/api/reportes") => true,
                (Roles.Cajero, string p) when p.Contains("/api/productos") && method == "GET" => true,

                // Vendedor - solo consulta de inventario y reportes
                (Roles.Vendedor, string p) when p.Contains("/api/movimientos") && method == "GET" => true,
                (Roles.Vendedor, string p) when p.Contains("/api/reportes/inventario") && method == "GET" => true,
                (Roles.Vendedor, string p) when p.Contains("/api/productos") && method == "GET" => true,

                _ => false
            };
        }
    }
}