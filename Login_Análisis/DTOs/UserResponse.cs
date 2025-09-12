namespace Login_Análisis.DTOs.Responses
{
    public class UserResponse
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string Usuario { get; set; }
        public string Email { get; set; }
        public string Rol { get; set; }
        public bool Estado { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaUltimoLogin { get; set; }
    }
}