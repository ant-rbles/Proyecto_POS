namespace Login_Análisis.DTOs
{
    public class CompraDetallePdfDto
    {
        public string Producto { get; set; }
        public string Unidad { get; set; }
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal TotalLinea { get; set; }
    }
}
