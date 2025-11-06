namespace Login_Análisis.DTOs
{
    public class ProveedorResponse
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string RUC { get; set; }
        public string Direccion { get; set; }
        public string Telefono { get; set; }
        public string Email { get; set; }
        public string Contacto { get; set; }
        public bool Estado { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
}