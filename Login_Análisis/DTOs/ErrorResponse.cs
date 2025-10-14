namespace Login_Análisis.DTOs.Responses
{
    public class ErrorResponse
    {
        public required string Message { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }
}