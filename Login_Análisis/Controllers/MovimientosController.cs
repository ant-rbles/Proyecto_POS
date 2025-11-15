using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using Login_Análisis.DTOs;
using Microsoft.AspNetCore.Authorization;
using Login_Análisis.Constants;
using Login_Análisis.Attributes;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MovimientosController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public MovimientosController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpGet]
        [RoleAccess(Roles.Administrador, Roles.Cajero)] // Solo Admin y Cajero pueden ver movimientos
        public async Task<IActionResult> ObtenerMovimientos(
            [FromQuery] string? fechaInicio,
            [FromQuery] string? fechaFin,
            [FromQuery] string? tipo,
            [FromQuery] int? productoId)
        {
            try
            {
                DateTime? fInicio = string.IsNullOrEmpty(fechaInicio) ? null : DateTime.Parse(fechaInicio);
                DateTime? fFin = string.IsNullOrEmpty(fechaFin) ? null : DateTime.Parse(fechaFin);

                var movimientos = await _productoService.ObtenerMovimientosInventario(fInicio, fFin, tipo, productoId);
                return Ok(movimientos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost("ajuste")]
        [RoleAccess(Roles.Administrador)] // Solo Administrador puede hacer ajustes de inventario
        public async Task<IActionResult> RegistrarAjuste([FromBody] AjusteDto dto)
        {
            try
            {
                var result = await _productoService.CrearAjusteInventario(
                    dto.ProductoId,
                    dto.Cantidad,
                    dto.Observaciones,
                    dto.UsuarioId,
                    dto.Tipo
                );

                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new { Message = result.message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("producto/{productoId}")]
        [RoleAccess(Roles.Administrador, Roles.Cajero, Roles.Vendedor)] // Todos pueden consultar movimientos de un producto específico
        public async Task<IActionResult> ObtenerMovimientosProducto(int productoId)
        {
            try
            {
                var movimientos = await _productoService.ObtenerMovimientosPorProducto(productoId);
                return Ok(movimientos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }
    }
}