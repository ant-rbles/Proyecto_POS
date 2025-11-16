using Login_Análisis.Constants;
using Login_Análisis.DTOs;
using Login_Análisis.Filters;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AuthorizeRole(Roles.Administrador, Roles.Cajero, Roles.Vendedor)]
    public class MovimientosController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public MovimientosController(ProductoService productoService)
        {
            _productoService = productoService;
        }
        [HttpGet]
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
        [AuthorizeRole(Roles.Administrador)]
        public async Task<IActionResult> RegistrarAjuste([FromBody] AjusteDto dto)
        {
            var result = await _productoService.CrearAjusteInventario(
                dto.ProductoId,
                dto.Cantidad,
                dto.Observaciones,
                dto.UsuarioId,
                dto.Tipo
            );

            return Ok(result);
        }

        [HttpGet("producto/{productoId}")]
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

    public class AjusteInventarioRequest
    {
        public int ProductoId { get; set; }
        public decimal Cantidad { get; set; }
        public string Observaciones { get; set; }
        public int? UsuarioId { get; set; }
    }
}