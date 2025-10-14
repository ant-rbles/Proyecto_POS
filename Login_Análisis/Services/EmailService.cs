using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

public class EmailService
{
    private readonly EmailSettings _emailSettings;

    public EmailService(IOptions<EmailSettings> emailSettings)
    {
        _emailSettings = emailSettings.Value;
    }

    public async Task<bool> SendPasswordResetEmail(string toEmail, string resetToken)
    {
        try
        {
            var smtpClient = new SmtpClient(_emailSettings.SmtpServer)
            {
                Port = _emailSettings.Port,
                Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password),
                EnableSsl = _emailSettings.EnableSsl,
            };

            // CODIFICAR EL TOKEN - CORRECCIÓN CRÍTICA
            var encodedToken = WebUtility.UrlEncode(resetToken);
            var resetLink = $"{_emailSettings.BaseUrl}/reset-password?token={encodedToken}";

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_emailSettings.FromAddress, _emailSettings.FromName),
                Subject = "Recuperación de Contraseña - SecureLogin",
                Body = $@"
                    <h2>Recuperación de Contraseña</h2>
                    <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                    <p>Para continuar, haz clic en el siguiente enlace:</p>
                    <p><a href='{resetLink}'>{resetLink}</a></p>
                    <p>Este enlace expirará en 1 hora.</p>
                    <p>Si no solicitaste este cambio, ignora este mensaje.</p>
                    <br>
                    <p>Saludos,<br>Equipo de SecureLogin</p>
                ",
                IsBodyHtml = true,
            };

            mailMessage.To.Add(toEmail);

            await smtpClient.SendMailAsync(mailMessage);
            return true;
        }
        catch (Exception ex)
        {
            // Log the error
            Console.WriteLine($"Error enviando email: {ex.Message}");
            return false;
        }
    }
}

public class EmailSettings
{
    public required string SmtpServer { get; set; }
    public int Port { get; set; }
    public required string Username { get; set; }
    public required string Password { get; set; }
    public bool EnableSsl { get; set; }
    public required string FromAddress { get; set; }
    public required string FromName { get; set; }
    public required string BaseUrl { get; set; }
}
