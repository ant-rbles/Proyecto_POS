// Login_Análisis/Attributes/RoleAccessAttribute.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Linq;
using System.Security.Claims;
using Login_Análisis.Constants;

namespace Login_Análisis.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public class RoleAccessAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string[] _allowedRoles;

        public RoleAccessAttribute(params string[] allowedRoles)
        {
            _allowedRoles = allowedRoles;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Verificar si el usuario está autenticado
            if (!context.HttpContext.User.Identity.IsAuthenticated)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // Obtener el rol del usuario desde los claims
            var userRole = context.HttpContext.User.Claims
                .FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            // Si no tiene rol, denegar acceso
            if (string.IsNullOrEmpty(userRole))
            {
                context.Result = new ForbidResult();
                return;
            }

            // Verificar si el usuario tiene alguno de los roles permitidos
            var hasAccess = _allowedRoles.Any(role =>
                string.Equals(role, userRole, StringComparison.OrdinalIgnoreCase));

            if (!hasAccess)
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }
}