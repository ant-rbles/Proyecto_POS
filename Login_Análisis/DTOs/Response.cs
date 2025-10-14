namespace Login_Análisis.DTOs.Responses
{
    public class Responses
    {
        public required bool Success { get; set; }
        public required string Message { get; set; }
        public required string Token { get; set; }
        public required UserResponse User { get; set; }
    }
}