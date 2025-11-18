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

        // PERMISOS ESPECÍFICOS SEGÚN DOCUMENTACIÓN
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

        public static bool PuedeGestionarCategorias(string role)
        {
            return role == Administrador;
        }

        public static bool PuedeGestionarUnidadesMedida(string role)
        {
            return role == Administrador;
        }

        public static bool PuedeGestionarClientes(string role)
        {
            return role == Administrador;
        }

        // PROCESAR VENTAS - Solo Cajero y Administrador
        public static bool PuedeProcesarVentas(string role)
        {
            return role == Administrador || role == Cajero;
        }

        // CONSULTAR INVENTARIO - Todos los roles
        public static bool PuedeConsultarInventario(string role)
        {
            return role == Administrador || role == Cajero || role == Vendedor;
        }

        // GENERAR REPORTES - Administrador y Cajero
        public static bool PuedeGenerarReportes(string role)
        {
            return role == Administrador || role == Cajero;
        }

        // GENERAR PRESUPUESTOS - Solo Vendedor (nuevo permiso)
        public static bool PuedeGenerarPresupuestos(string role)
        {
            return role == Vendedor;
        }

        public static bool PuedeGestionarPresupuestos(string role)
        {
            return role == Vendedor;
        }

        // AJUSTES DE INVENTARIO - Solo Administrador
        public static bool PuedeAjustarInventario(string role)
        {
            return role == Administrador;
        }

        // MÉTODO MEJORADO PARA MÓDULOS PERMITIDOS
        public static string[] GetModulosPermitidos(string role)
        {
            return role switch
            {
                Administrador => new[] { "dashboard", "usuarios", "productos", "categorias", "unidades", "proveedores", "clientes", "compras", "ventas", "inventario", "movimientos", "reportes", "presupuestos" },
                Cajero => new[] { "dashboard", "ventas", "inventario", "reportes", "clientes", "presupuestos" },
                Vendedor => new[] { "dashboard", "inventario", "presupuestos", "clientes" },
                _ => new string[0]
            };
        }

        // NUEVO: Método para verificar permisos de acción específicos
        public static bool TienePermiso(string role, string accion, string modulo)
        {
            return (role, modulo, accion) switch
            {
                // ADMINISTRADOR - Acceso completo
                (Administrador, _, _) => true,

                // CAJERO - Permisos específicos
                (Cajero, "ventas", "crear") => true,
                (Cajero, "ventas", "ver") => true,
                (Cajero, "ventas", "facturar") => true,
                (Cajero, "inventario", "consultar") => true,
                (Cajero, "reportes", "ver") => true,
                (Cajero, "clientes", "consultar") => true,
                (Cajero, "clientes", "crear") => true,

                // VENDEDOR - Permisos específicos
                (Vendedor, "inventario", "consultar") => true,
                (Vendedor, "presupuestos", "crear") => true,
                (Vendedor, "presupuestos", "ver") => true,
                (Vendedor, "clientes", "consultar") => true,

                _ => false
            };
        }
    }
}