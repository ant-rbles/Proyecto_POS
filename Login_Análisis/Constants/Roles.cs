namespace Login_Análisis.Constants
{
    public static class Roles
    {
        public const string Administrador = "Administrador";
        public const string Cajero = "Cajero";
        public const string Vendedor = "Vendedor";

        public static bool IsValidRole(string role)
        {
            return role == Administrador || role == Cajero || role == Vendedor;
        }

        public static string[] GetAllRoles()
        {
            return new[] { Administrador, Cajero, Vendedor };
        }
    }
}