using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.DTOs
{
    public class AjusteDto
    {
        public int ProductoId { get; set; }
        public decimal Cantidad { get; set; }
        public string Observaciones { get; set; }
        public int? UsuarioId { get; set; }
        public string Tipo { get; set; }
    }
}

