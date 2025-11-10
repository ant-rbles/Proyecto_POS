namespace Login_Análisis.DTOs
{
    public class MovimientoFiltroDto
    {
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public string Tipo { get; set; }
        public int? ProductoId { get; set; }
    }
}
