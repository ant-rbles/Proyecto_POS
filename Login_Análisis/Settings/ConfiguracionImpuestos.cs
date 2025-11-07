namespace Login_Análisis.Settings
{
    public class ConfiguracionImpuestos
    {
        public decimal IVA { get; set; } = 0.12m; // 12% IVA Guatemala
        public string Moneda { get; set; } = "GTQ";
        public string SimboloMoneda { get; set; } = "Q";
    }
}
