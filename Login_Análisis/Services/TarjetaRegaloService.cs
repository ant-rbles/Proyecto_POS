using Login_Análisis.Data;
using Login_Análisis.DTOs;
using Login_Análisis.Models;
using Microsoft.EntityFrameworkCore;


namespace Login_Análisis.Services
{
    public class TarjetaRegaloService
    {
        private readonly ApplicationDbContext _context;

        public TarjetaRegaloService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TarjetaRegalo>> Listar()
        {
            return await _context.TarjetasRegalo.ToListAsync();
        }

        public async Task<TarjetaRegalo?> Obtener(int id)
        {
            return await _context.TarjetasRegalo.FindAsync(id);
        }

        public async Task<(bool success, string message)> Crear(TarjetaRegalo t)
        {
            if (await _context.TarjetasRegalo.AnyAsync(x => x.Codigo == t.Codigo))
                return (false, "El código ya existe.");

            _context.TarjetasRegalo.Add(t);
            await _context.SaveChangesAsync();

            return (true, "Tarjeta creada correctamente.");
        }

        public async Task<(bool success, string message)> Actualizar(int id, TarjetaRegaloUpdateRequest req)
        {
            var tarjeta = await Obtener(id);
            if (tarjeta == null) return (false, "Tarjeta no encontrada");

            if (tarjeta.Estado == "Anulada" || tarjeta.Estado == "Expirada")
                return (false, "No se puede modificar una tarjeta anulada o expirada.");

            tarjeta.MontoInicial = req.MontoInicial;
            tarjeta.Moneda = req.Moneda;
            tarjeta.FechaExpiracion = req.FechaExpiracion;
            tarjeta.UsuarioActualizacion = req.UsuarioId;
            tarjeta.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, "Tarjeta actualizada");
        }

        public async Task<(bool success, string message)> Anular(int id, int usuarioId)
        {
            var tarjeta = await Obtener(id);
            if (tarjeta == null) return (false, "Tarjeta no encontrada");

            tarjeta.Estado = "Anulada";
            tarjeta.UsuarioActualizacion = usuarioId;
            tarjeta.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, "Tarjeta anulada correctamente.");
        }
    }

}
