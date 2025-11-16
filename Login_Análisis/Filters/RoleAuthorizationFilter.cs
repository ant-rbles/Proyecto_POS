using Login_Análisis.Constants;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace Login_Análisis.Filters
{
    public class RoleAuthorizationFilter : IAuthorizationFilter
    {
        private readonly string[] _allowedRoles;

        public RoleAuthorizationFilter(params string[] allowedRoles)
        {
            _allowedRoles = allowedRoles;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            if (!user.Identity.IsAuthenticated)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var userRole = user.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userRole) || !_allowedRoles.Contains(userRole))
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }

    // Atributo personalizado para autorización por rol
    public class AuthorizeRoleAttribute : TypeFilterAttribute
    {
        public AuthorizeRoleAttribute(params string[] roles) : base(typeof(RoleAuthorizationFilter))
        {
            Arguments = new object[] { roles };
        }
    }
}