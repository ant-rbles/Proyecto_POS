namespace Login_Análisis.DTOs
{
    public class PresupuestoResponse
    {
        public int Id { get; set; }
        public string NumeroPresupuesto { get; set; }
        public DateTime FechaPresupuesto { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public int? ClienteId { get; set; }
        public string NombreCliente { get; set; }
        public string NITCliente { get; set; }
        public string DireccionCliente { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Impuestos { get; set; }
        public decimal Total { get; set; }
        public string Observaciones { get; set; }
        public string Estado { get; set; }
        public string UsuarioCreacionNombre { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaAprobacion { get; set; }
        public int DiasRestantes { get; set; }

        public List<DetallePresupuestoResponse> Detalles { get; set; } = new List<DetallePresupuestoResponse>();
    }

    public class DetallePresupuestoResponse
    {
        public int Id { get; set; }
        public int ProductoId { get; set; }
        public string ProductoNombre { get; set; }
        public string ProductoCodigo { get; set; }
        public int UnidadMedidaId { get; set; }
        public string UnidadMedidaNombre { get; set; }
        public string UnidadMedidaAbreviatura { get; set; }
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal DescuentoAplicado { get; set; }
        public decimal TotalLinea { get; set; }
        public string Observaciones { get; set; }
    }
}