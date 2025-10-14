namespace Login_Análisis.DTOs.Responses
{
    public class UserResponse
    {
        public int Id { get; set; }
        public required string Nombre { get; set; }
        public required string Usuario { get; set; }
        public required string Email { get; set; }
        public required string Rol { get; set; }
        public bool Estado { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaUltimoLogin { get; set; }
    }
}