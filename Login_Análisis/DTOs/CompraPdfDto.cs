namespace Login_Análisis.DTOs
{
    public class CompraPdfDto
    {
        public string NumeroFactura { get; set; }
        public string Proveedor { get; set; }
        public DateTime FechaCompra { get; set; }
        public string Usuario { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Impuestos { get; set; }
        public decimal Total { get; set; }
        public List<CompraDetallePdfDto> Detalles { get; set; } = new();
    }
}
