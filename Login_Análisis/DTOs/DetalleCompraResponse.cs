namespace Login_Análisis.DTOs
{
    public class DetalleCompraResponse
    {
        public int Id { get; set; }
        public int ProductoId { get; set; }
        public string ProductoNombre { get; set; }
        public int UnidadMedidaId { get; set; }
        public string UnidadMedidaNombre { get; set; }
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal TotalLinea { get; set; }
    }
}
