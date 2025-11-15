namespace Login_Análisis.DTOs
{
    public class TarjetaRegaloRequest
    {
        public string Codigo { get; set; }
        public decimal MontoInicial { get; set; }
        public decimal SaldoActual { get; set; }
        public string Moneda { get; set; }
        public DateTime FechaExpiracion { get; set; }
        public int UsuarioId { get; set; }
    }

}
