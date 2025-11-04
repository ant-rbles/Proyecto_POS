using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MovimientosController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public MovimientosController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerMovimientos(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin,
            [FromQuery] string? tipoMovimiento = null,
            [FromQuery] int? productoId = null)
        {
            try
            {
                var movimientos = await _productoService.ObtenerMovimientosInventario(fechaInicio, fechaFin, tipoMovimiento, productoId);
                return Ok(movimientos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost("ajuste")]
        public async Task<IActionResult> CrearAjusteInventario([FromBody] AjusteInventarioRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos del ajuste inválidos" });
            }

            try
            {
                var result = await _productoService.CrearAjusteInventario(
                    request.ProductoId,
                    request.Cantidad,
                    request.Observaciones,
                    request.UsuarioId);

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