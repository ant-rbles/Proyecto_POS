namespace Login_Análisis.Models
{
    public class TarjetaRegalo
    {
        public int Id { get; set; }

        public string Codigo { get; set; }

        public decimal MontoInicial { get; set; }

        public decimal SaldoActual { get; set; }

        public string Moneda { get; set; } = "GTQ";

        public DateTime FechaEmision { get; set; }

        public DateTime FechaExpiracion { get; set; }

        public string Estado { get; set; } // Activa, Agotada, Expirada, Anulada

        public int UsuarioRegistro { get; set; }

        public DateTime FechaRegistro { get; set; }

        public int? UsuarioActualizacion { get; set; }

        public DateTime? FechaActualizacion { get; set; }
    }

}
