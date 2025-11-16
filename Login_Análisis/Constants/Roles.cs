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

        // Nuevos métodos para permisos
        public static bool PuedeGestionarUsuarios(string role)
        {
            return role == Administrador;
        }

        public static bool PuedeGestionarProductos(string role)
        {
            return role == Administrador;
        }

        public static bool PuedeGestionarInventario(string role)
        {
            return role == Administrador;
        }

        public static bool PuedeGestionarProveedores(string role)
        {
            return role == Administrador;
        }

        public static bool PuedeGestionarCompras(string role)
        {
            return role == Administrador;
        }

        public static bool PuedeProcesarVentas(string role)
        {
            return role == Administrador || role == Cajero;
        }

        public static bool PuedeConsultarInventario(string role)
        {
            return role == Administrador || role == Cajero || role == Vendedor;
        }

        public static bool PuedeGenerarReportes(string role)
        {
            return role == Administrador || role == Cajero;
        }

        public static bool PuedeGenerarPresupuestos(string role)
        {
            return role == Vendedor;
        }

        // Método para obtener módulos permitidos por rol
        public static string[] GetModulosPermitidos(string role)
        {
            return role switch
            {
                Administrador => new[] { "usuarios", "productos", "categorias", "unidades", "proveedores", "clientes", "compras", "ventas", "inventario", "reportes" },
                Cajero => new[] { "ventas", "inventario", "reportes" },
                Vendedor => new[] { "inventario", "reportes" },
                _ => new string[0]
            };
        }
    }
}