namespace Login_Análisis.DTOs
{
    public class TarjetaRegaloUpdateRequest
    {
        public decimal MontoInicial { get; set; }
        public string Moneda { get; set; }
        public DateTime FechaExpiracion { get; set; }
        public int UsuarioId { get; set; }
    }

}
