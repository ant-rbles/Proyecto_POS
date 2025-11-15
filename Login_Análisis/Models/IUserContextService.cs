using System.Security.Claims;

namespace Login_Análisis.Services
{
    public interface IUserContextService
    {
        int? GetUserId();
        string GetUserRole();
        string GetUserName();
        ClaimsPrincipal GetUser();
    }
}