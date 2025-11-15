using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Login_Análisis.Services
{
    public class UserContextService : IUserContextService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserContextService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public ClaimsPrincipal GetUser()
        {
            return _httpContextAccessor.HttpContext?.User;
        }

        public int? GetUserId()
        {
            var userIdClaim = GetUser()?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out var userId))
                return userId;
            return null;
        }

        public string GetUserRole()
        {
            return GetUser()?.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";
        }

        public string GetUserName()
        {
            return GetUser()?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
        }
    }
}