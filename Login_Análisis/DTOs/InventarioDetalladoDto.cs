namespace Login_Análisis.DTOs
{
    public class InventarioDetalladoDto
    {
        public int Id { get; set; }

        public string Codigo { get; set; }
        public string Producto { get; set; }
        public string Categoria { get; set; }
        public string ProveedorNombre { get; set; }
        public string Unidad { get; set; }

        public decimal StockActual { get; set; }
        public decimal StockMinimo { get; set; }

        public decimal PrecioCosto { get; set; }
        public decimal PrecioVenta { get; set; }

        public decimal ValorStock { get; set; }
        public string Estado { get; set; }
    }
}

