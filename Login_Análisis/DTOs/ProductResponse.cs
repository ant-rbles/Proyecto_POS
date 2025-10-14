namespace Login_Análisis.DTOs.Responses
{
    public class ProductResponse
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string Categoria { get; set; }
        public decimal Precio { get; set; }
        public string Descripcion { get; set; }
        public int Stock { get; set; }
        public string Codigo { get; set; }
        public int? IdProveedor { get; set; }
        public bool Estado { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
}