using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using Login_Análisis.DTOs;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VentasController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public VentasController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpPost]
        public async Task<IActionResult> CrearVenta([FromBody] VentaRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        Message = "Datos de la venta inválidos",
                        Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                    });
                }

                // Validar stock antes de procesar
                foreach (var detalle in request.Detalles)
                {
                    var producto = await _productoService.ObtenerProducto(detalle.ProductoId);
                    if (producto == null || producto.StockActual < detalle.Cantidad)
                    {
                        return BadRequest(new
                        {
                            Message = $"Stock insuficiente para el producto {producto?.Nombre}"
                        });
                    }
                }

                var venta = new Venta
                {
                    NumeroFactura = GenerarNumeroFactura(),
                    FechaVenta = request.FechaVenta,
                    Impuestos = request.Impuestos,
                    Observaciones = request.Observaciones,
                    ClienteId = request.ClienteId,
                    NombreCliente = request.NombreCliente,
                    UsuarioCreacion = request.UsuarioCreacion,
                    FechaCreacion = DateTime.UtcNow
                };

                var detalles = request.Detalles.Select(d => new DetalleVenta
                {
                    ProductoId = d.ProductoId,
                    UnidadMedidaId = d.UnidadMedidaId,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    TotalLinea = d.Cantidad * d.PrecioUnitario
                }).ToList();

                var result = await _productoService.CrearVenta(venta, detalles);

                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new
                {
                    Message = result.message,
                    Venta = result.venta,
                    VentaId = result.venta.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Error interno del servidor", Error = ex.Message });
            }
        }

        private string GenerarNumeroFactura()
        {
            return $"F{DateTime.Now:yyyyMMddHHmmss}";
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerVentas(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin,
            [FromQuery] string? estado = null)
        {
            var ventas = await _productoService.ObtenerVentas(fechaInicio, fechaFin, estado);
            return Ok(ventas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerVenta(int id)
        {
            var venta = await _productoService.ObtenerVenta(id);
            if (venta == null)
                return NotFound(new { Message = "Venta no encontrada" });

            return Ok(venta);
        }

        [HttpPut("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoVenta(int id, [FromBody] CambiarEstadoVentaRequest request)
        {
            try
            {
                var result = await _productoService.CambiarEstadoVenta(id, request.Estado);
                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new { Message = result.message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> DescargarFacturaPdf(int id)
        {
            try
            {
                var pdfBytes = await _productoService.GenerarFacturaPdf(id);
                if (pdfBytes == null)
                    return NotFound(new { Message = "Venta no encontrada" });

                return File(pdfBytes, "application/pdf", $"factura_{id}.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error al generar PDF: {ex.Message}" });
            }
        }

        // Método para obtener estadísticas de ventas
        [HttpGet("estadisticas")]
        public async Task<IActionResult> ObtenerEstadisticasVentas(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin)
        {
            try
            {
                var estadisticas = await _productoService.ObtenerEstadisticasVentas(fechaInicio, fechaFin);
                return Ok(estadisticas);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }
    }

    public class CambiarEstadoVentaRequest
    {
        [Required]
        public string Estado { get; set; }
    }
}